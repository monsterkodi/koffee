// koffee 0.28.0

/*
000   000   0000000   0000000    00000000   0000000  
0000  000  000   000  000   000  000       000       
000 0 000  000   000  000   000  0000000   0000000   
000  0000  000   000  000   000  000            000  
000   000   0000000   0000000    00000000  0000000
 */
var Access, Arr, Assign, Base, Block, BooleanLiteral, Call, Class, Code, CodeFragment, Comment, Existence, Expansion, ExportAllDeclaration, ExportDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier, ExportSpecifierList, Extends, For, IdentifierLiteral, If, ImportClause, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, ImportSpecifierList, In, Index, InfinityLiteral, JS_FORBIDDEN, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, MetaIf, ModuleDeclaration, ModuleSpecifier, ModuleSpecifierList, NEGATE, NO, NaNLiteral, NullLiteral, NumberLiteral, Obj, Op, Param, Parens, PassthroughLiteral, PropertyName, Range, RegexLiteral, RegexWithInterpolations, Return, SIMPLENUM, Scope, Slice, Splat, StatementLiteral, StringLiteral, StringWithInterpolations, SuperCall, Switch, TAB, THIS, TaggedTemplateCall, ThisLiteral, Throw, Try, UTILITIES, UndefinedLiteral, Value, While, YES, YieldReturn, addLocationDataFn, compact, compileMetaIf, del, ends, extend, flatten, hasFeature, injectFeature, injectMeta, isComplexOrAssignable, isLiteralArguments, isLiteralThis, isUnassignable, locationDataToString, merge, multident, ref1, ref2, some, starts, stringify, throwSyntaxError, unfoldSoak, utility,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf,
    slice = [].slice;

Error.stackTraceLimit = 2e308;

Scope = require('./scope').Scope;

ref1 = require('./lexer'), isUnassignable = ref1.isUnassignable, JS_FORBIDDEN = ref1.JS_FORBIDDEN;

ref2 = require('./helpers'), compact = ref2.compact, flatten = ref2.flatten, extend = ref2.extend, merge = ref2.merge, del = ref2.del, starts = ref2.starts, ends = ref2.ends, some = ref2.some, injectFeature = ref2.injectFeature, hasFeature = ref2.hasFeature, injectMeta = ref2.injectMeta, addLocationDataFn = ref2.addLocationDataFn, locationDataToString = ref2.locationDataToString, throwSyntaxError = ref2.throwSyntaxError, stringify = ref2.stringify;

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
        var ref3;
        this.code = "" + code;
        this.locationData = parent != null ? parent.locationData : void 0;
        this.type = (parent != null ? (ref3 = parent.constructor) != null ? ref3.name : void 0 : void 0) || 'unknown';
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
        var args, argumentsNode, func, jumpNode, meth, parts, ref3;
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
        if (func.isGenerator || ((ref3 = func.base) != null ? ref3.isGenerator : void 0)) {
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
        var attr, child, j, k, len1, len2, ref3, ref4;
        if (!this.children) {
            return this;
        }
        ref3 = this.children;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            attr = ref3[j];
            if (this[attr]) {
                ref4 = flatten([this[attr]]);
                for (k = 0, len2 = ref4.length; k < len2; k++) {
                    child = ref4[k];
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
        return throwSyntaxError(message, this.locationData);
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
        var exp, j, len1, ref3;
        ref3 = this.expressions;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            exp = ref3[j];
            if (exp.isStatement(o)) {
                return true;
            }
        }
        return false;
    };

    Block.prototype.jumps = function(o) {
        var exp, j, jumpNode, len1, ref3;
        ref3 = this.expressions;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            exp = ref3[j];
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
        var answer, compiledNodes, fragments, index, j, len1, node, ref3, top;
        this.tab = o.indent;
        top = o.level === LEVEL_TOP;
        compiledNodes = [];
        ref3 = this.expressions;
        for (index = j = 0, len1 = ref3.length; j < len1; index = ++j) {
            node = ref3[index];
            node = node.unwrapAll();
            node = node.unfoldSoak(o) || node;
            if (node instanceof Block) {
                compiledNodes.push(node.compileNode(o));
            } else if (top) {
                node.front = true;
                fragments = node.compileToFragments(o);
                if (!node.isStatement(o)) {
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
        var exp, fragments, i, j, len1, name, prelude, preludeExps, ref3, ref4, rest;
        o.indent = o.bare ? '' : TAB;
        o.level = LEVEL_TOP;
        this.spaced = true;
        o.scope = new Scope(null, this, null, (ref3 = o.referencedVars) != null ? ref3 : []);
        ref4 = o.locals || [];
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            name = ref4[j];
            o.scope.parameter(name);
        }
        prelude = [];
        if (!o.bare) {
            preludeExps = (function() {
                var k, len2, ref5, results;
                ref5 = this.expressions;
                results = [];
                for (i = k = 0, len2 = ref5.length; k < len2; i = ++k) {
                    exp = ref5[i];
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
        var assigns, declars, exp, fragments, i, j, len1, post, ref3, ref4, ref5, rest, scope, spaced;
        fragments = [];
        post = [];
        ref3 = this.expressions;
        for (i = j = 0, len1 = ref3.length; j < len1; i = ++j) {
            exp = ref3[i];
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
            ref4 = [this.spaced, false], spaced = ref4[0], this.spaced = ref4[1];
            ref5 = [this.compileNode(o), spaced], fragments = ref5[0], this.spaced = ref5[1];
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
        var code, ref3;
        code = ((ref3 = o.scope.method) != null ? ref3.bound : void 0) ? o.scope.method.context : this.value;
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
        var expr, ref3;
        expr = (ref3 = this.expression) != null ? ref3.makeReturn() : void 0;
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
        var j, len1, node, ref3;
        ref3 = this.properties.concat(this.base);
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            node = ref3[j];
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
        var lastProp, ref3;
        ref3 = this.properties, lastProp = ref3[ref3.length - 1];
        return lastProp instanceof Slice;
    };

    Value.prototype.looksStatic = function(className) {
        var ref3;
        return this.base.value === className && this.properties.length === 1 && ((ref3 = this.properties[0].name) != null ? ref3.value : void 0) !== 'prototype';
    };

    Value.prototype.unwrap = function() {
        if (this.properties.length) {
            return this;
        } else {
            return this.base;
        }
    };

    Value.prototype.cacheReference = function(o) {
        var base, bref, name, nref, ref3;
        ref3 = this.properties, name = ref3[ref3.length - 1];
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
                var fst, i, ifn, j, len1, prop, ref, ref3, ref4, snd;
                if (ifn = _this.base.unfoldSoak(o)) {
                    (ref3 = ifn.body.properties).push.apply(ref3, _this.properties);
                    return ifn;
                }
                ref4 = _this.properties;
                for (i = j = 0, len1 = ref4.length; j < len1; i = ++j) {
                    prop = ref4[i];
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
        var base, ref3;
        if (this.locationData && this.needsUpdatedStartLocation) {
            this.locationData.first_line = locationData.first_line;
            this.locationData.first_column = locationData.first_column;
            base = ((ref3 = this.variable) != null ? ref3.base : void 0) || this.variable;
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
        var base, ref3;
        base = ((ref3 = this.variable) != null ? ref3.base : void 0) || this.variable;
        if (base instanceof Call && !base.isNew) {
            base.newInstance();
        } else {
            this.isNew = true;
        }
        this.needsUpdatedStartLocation = true;
        return this;
    };

    Call.prototype.unfoldSoak = function(o) {
        var call, ifn, j, left, len1, list, ref3, ref4, rite;
        if (this.soak) {
            if (this instanceof SuperCall) {
                left = new Literal(this.superReference(o));
                rite = new Value(left);
            } else {
                if (ifn = unfoldSoak(o, this, 'variable')) {
                    return ifn;
                }
                ref3 = new Value(this.variable).cacheReference(o), left = ref3[0], rite = ref3[1];
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
        ref4 = list.reverse();
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            call = ref4[j];
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
        var arg, argIndex, compiledArgs, compiledArray, fragments, j, len1, preface, ref3, ref4;
        if ((ref3 = this.variable) != null) {
            ref3.front = this.front;
        }
        compiledArray = Splat.compileSplattedArray(o, this.args, true);
        if (compiledArray.length) {
            return this.compileSplat(o, compiledArray);
        }
        compiledArgs = [];
        ref4 = this.args;
        for (argIndex = j = 0, len1 = ref4.length; j < len1; argIndex = ++j) {
            arg = ref4[argIndex];
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
            var n, ref3, ref4, t;
            n = obj.variable.base.value;
            if (n === 'this') {
                n = (ref3 = obj.variable.properties) != null ? ref3[0].name.value : void 0;
                return n + ":this." + n;
            } else {
                t = ((ref4 = obj.value.variable) != null ? ref4["this"] : void 0) && 'this.' || '';
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
        var name, node, ref3;
        name = this.name.compileToFragments(o);
        node = this.name.unwrap();
        if (node instanceof PropertyName) {
            if (ref3 = node.value, indexOf.call(JS_FORBIDDEN, ref3) >= 0) {
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
        var isComplex, ref3, ref4, ref5, step;
        o = merge(o, {
            top: true
        });
        isComplex = del(o, 'isComplex');
        ref3 = this.cacheToCodeFragments(this.from.cache(o, LEVEL_LIST, isComplex)), this.fromC = ref3[0], this.fromVar = ref3[1];
        ref4 = this.cacheToCodeFragments(this.to.cache(o, LEVEL_LIST, isComplex)), this.toC = ref4[0], this.toVar = ref4[1];
        if (step = del(o, 'step')) {
            ref5 = this.cacheToCodeFragments(step.cache(o, LEVEL_LIST, isComplex)), this.step = ref5[0], this.stepVar = ref5[1];
        }
        this.fromNum = this.from.isNumber() ? Number(this.fromVar) : null;
        this.toNum = this.to.isNumber() ? Number(this.toVar) : null;
        return this.stepNum = (step != null ? step.isNumber() : void 0) ? Number(this.stepVar) : null;
    };

    Range.prototype.compileNode = function(o) {
        var cond, condPart, from, gt, idx, idxName, known, lt, namedIndex, ref3, ref4, stepPart, to, varPart;
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
        ref3 = [idx + " <" + this.equals, idx + " >" + this.equals], lt = ref3[0], gt = ref3[1];
        condPart = this.stepNum != null ? this.stepNum > 0 ? lt + " " + this.toVar : gt + " " + this.toVar : known ? ((ref4 = [this.fromNum, this.toNum], from = ref4[0], to = ref4[1], ref4), from <= to ? lt + " " + to : gt + " " + to) : (cond = this.stepVar ? this.stepVar + " > 0" : this.fromVar + " <= " + this.toVar, cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
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
        var args, body, cond, hasArgs, i, idt, j, known, post, pre, range, ref3, ref4, result, results, vars;
        known = (this.fromNum != null) && (this.toNum != null);
        if (known && Math.abs(this.fromNum - this.toNum) <= 20) {
            range = (function() {
                results = [];
                for (var j = ref3 = this.fromNum, ref4 = this.toNum; ref3 <= ref4 ? j <= ref4 : j >= ref4; ref3 <= ref4 ? j++ : j--){ results.push(j); }
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
        var compiled, compiledText, from, fromCompiled, ref3, to, toStr;
        ref3 = this.range, to = ref3.to, from = ref3.from;
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
        var answer, dynamicIndex, hasDynamic, i, idt, indent, j, join, k, key, l, lastNoncom, len1, len2, len3, node, oref, prop, props, ref3, value;
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
                        ref3 = prop.base.cache(o), key = ref3[0], value = ref3[1];
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
        var j, len1, prop, ref3;
        ref3 = this.properties;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            prop = ref3[j];
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
            var j, len1, ref3, results;
            ref3 = this.objects;
            results = [];
            for (j = 0, len1 = ref3.length; j < len1; j++) {
                obj = ref3[j];
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
        var j, len1, obj, ref3;
        ref3 = this.objects;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            obj = ref3[j];
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
        var message, name, node, ref3, tail;
        if (!this.variable) {
            return this.defaultClassVariableName;
        }
        ref3 = this.variable.properties, tail = ref3[ref3.length - 1];
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
        var bvar, j, len1, lhs, ref3;
        ref3 = this.boundFuncs;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            bvar = ref3[j];
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
                var cont, exps, i, j, len1, node, ref3;
                cont = true;
                if (child instanceof Class) {
                    return false;
                }
                if (child instanceof Block) {
                    ref3 = exps = child.expressions;
                    for (i = j = 0, len1 = ref3.length; j < len1; i = ++j) {
                        node = ref3[i];
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
        var bodyExpr, expr, j, k, len1, len2, param0, ref3, ref4, ref5;
        ref3 = classBody.expressions;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            expr = ref3[j];
            if (expr instanceof Code) {
                if (!((ref4 = expr.params[0]) != null ? ref4.name : void 0)) {
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
                ref5 = expr.body.expressions;
                for (k = 0, len2 = ref5.length; k < len2; k++) {
                    bodyExpr = ref5[k];
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
        var args, argumentsNode, func, jumpNode, klass, lname, name, ref3, superClass;
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
        (ref3 = this.body.expressions).unshift.apply(ref3, this.directives);
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
        var code, ref3;
        this.checkScope(o, 'import');
        o.importedSymbols = [];
        code = [];
        code.push(this.makeCode(this.tab + "import "));
        if (this.clause != null) {
            code.push.apply(code, this.clause.compileNode(o));
        }
        if (((ref3 = this.source) != null ? ref3.value : void 0) != null) {
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
        var code, ref3;
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
        if (((ref3 = this.source) != null ? ref3.value : void 0) != null) {
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
            var j, len1, ref3, results;
            ref3 = this.specifiers;
            results = [];
            for (j = 0, len1 = ref3.length; j < len1; j++) {
                specifier = ref3[j];
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
        var ref3;
        if ((ref3 = this.identifier, indexOf.call(o.importedSymbols, ref3) >= 0) || o.scope.check(this.identifier)) {
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
        var answer, compiledName, isValue, j, name, properties, prototype, ref3, ref4, ref5, ref6, ref7, ref8, val, varBase;
        if (isValue = this.variable instanceof Value) {
            if (this.variable.isArray() || this.variable.isObject()) {
                return this.compilePatternMatch(o);
            }
            if (this.variable.isSplice()) {
                return this.compileSplice(o);
            }
            if ((ref3 = this.context) === '||=' || ref3 === '&&=' || ref3 === '?=') {
                return this.compileConditional(o);
            }
            if ((ref4 = this.context) === '**=' || ref4 === '//=' || ref4 === '%%=') {
                return this.compileSpecialMath(o);
            }
        }
        if (this.value instanceof Code) {
            if (this.value["static"]) {
                this.value.klass = this.variable.base;
                this.value.name = this.variable.properties[0];
                this.value.variable = this.variable;
            } else if (((ref5 = this.variable.properties) != null ? ref5.length : void 0) >= 2) {
                ref6 = this.variable.properties, properties = 3 <= ref6.length ? slice.call(ref6, 0, j = ref6.length - 2) : (j = 0, []), prototype = ref6[j++], name = ref6[j++];
                if (((ref7 = prototype.name) != null ? ref7.value : void 0) === 'prototype') {
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
            if (ref8 = this.fragmentsToText(compiledName), indexOf.call(JS_FORBIDDEN, ref8) >= 0) {
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
        var acc, assigns, code, defaultValue, expandedIdx, fragments, i, idx, isObject, ivar, j, len1, message, name, obj, objects, olen, ref, ref3, ref4, ref5, ref6, rest, top, val, value, vvar, vvarText;
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
                ref3 = obj, (ref4 = ref3.variable, idx = ref4.base), obj = ref3.value;
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
                    ref5 = obj, (ref6 = ref5.variable, idx = ref6.base), obj = ref5.value;
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
        var fragments, left, ref3, right;
        ref3 = this.variable.cacheReference(o), left = ref3[0], right = ref3[1];
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
        var left, ref3, right;
        ref3 = this.variable.cacheReference(o), left = ref3[0], right = ref3[1];
        return new Assign(left, new Op(this.context.slice(0, -1), right, this.value)).compileToFragments(o);
    };

    Assign.prototype.compileSplice = function(o) {
        var answer, exclusive, from, fromDecl, fromRef, name, ref3, ref4, ref5, to, valDef, valRef;
        ref3 = this.variable.properties.pop().range, from = ref3.from, to = ref3.to, exclusive = ref3.exclusive;
        name = this.variable.compile(o);
        if (from) {
            ref4 = this.cacheToCodeFragments(from.cache(o, LEVEL_OP)), fromDecl = ref4[0], fromRef = ref4[1];
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
        ref5 = this.value.cache(o, LEVEL_LIST), valDef = ref5[0], valRef = ref5[1];
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
        var answer, boundfunc, code, exprs, i, j, k, l, len1, len2, len3, len4, len5, len6, lit, m, p, param, params, q, r, ref, ref3, ref4, ref5, ref6, ref7, ref8, splats, uniqs, val, wasEmpty, wrapper;
        if (this.bound && ((ref3 = o.scope.method) != null ? ref3.bound : void 0)) {
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
        ref4 = this.params;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            param = ref4[j];
            if (!(param instanceof Expansion)) {
                o.scope.parameter(param.asReference(o));
            }
        }
        ref5 = this.params;
        for (k = 0, len2 = ref5.length; k < len2; k++) {
            param = ref5[k];
            if (!(param.splat || param instanceof Expansion)) {
                continue;
            }
            ref6 = this.params;
            for (l = 0, len3 = ref6.length; l < len3; l++) {
                p = ref6[l];
                if (!(p instanceof Expansion) && p.name.value) {
                    o.scope.add(p.name.value, 'var', true);
                }
            }
            splats = new Assign(new Value(new Arr((function() {
                var len4, m, ref7, results;
                ref7 = this.params;
                results = [];
                for (m = 0, len4 = ref7.length; m < len4; m++) {
                    p = ref7[m];
                    results.push(p.asReference(o));
                }
                return results;
            }).call(this))), new Value(new IdentifierLiteral('arguments')));
            break;
        }
        ref7 = this.params;
        for (m = 0, len4 = ref7.length; m < len4; m++) {
            param = ref7[m];
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
            (ref8 = this.body.expressions).unshift.apply(ref8, exprs);
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
        var j, len1, param, ref3, results;
        ref3 = this.params;
        results = [];
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            param = ref3[j];
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
        var atParam, j, len1, node, obj, ref3, ref4;
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
        ref4 = (ref3 = name.objects) != null ? ref3 : [];
        for (j = 0, len1 = ref4.length; j < len1; j++) {
            obj = ref4[j];
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
            var k, len2, ref3, results;
            ref3 = list.slice(0, index);
            results = [];
            for (k = 0, len2 = ref3.length; k < len2; k++) {
                node = ref3[k];
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
        var ref3;
        return this.isUnary() && ((ref3 = this.operator) === '+' || ref3 === '-') && this.first instanceof Value && this.first.isNumber();
    };

    Op.prototype.isYield = function() {
        var ref3;
        return (ref3 = this.operator) === 'yield' || ref3 === 'yield*';
    };

    Op.prototype.isUnary = function() {
        return !this.second;
    };

    Op.prototype.isComplex = function() {
        return !this.isNumber();
    };

    Op.prototype.isChainable = function() {
        var ref3;
        return (ref3 = this.operator) === '<' || ref3 === '>' || ref3 === '>=' || ref3 === '<=' || ref3 === '===' || ref3 === '!==';
    };

    Op.prototype.invert = function() {
        var allInvertable, curr, fst, op, ref3;
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
        } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((ref3 = fst.operator) === '!' || ref3 === 'in' || ref3 === 'instanceof')) {
            return fst;
        } else {
            return new Op('!', this);
        }
    };

    Op.prototype.unfoldSoak = function(o) {
        var ref3;
        return ((ref3 = this.operator) === '++' || ref3 === '--' || ref3 === 'delete') && unfoldSoak(o, this, 'first');
    };

    Op.prototype.generateDo = function(exp) {
        var call, func, j, len1, param, passedParams, ref, ref3;
        passedParams = [];
        func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
        ref3 = func.params || [];
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            param = ref3[j];
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
        var answer, isChain, lhs, message, ref3, rhs;
        isChain = this.isChainable() && this.first.isChainable();
        if (!isChain) {
            this.first.front = this.front;
        }
        if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
            this.error('delete operand may not be argument or var');
        }
        if ((ref3 = this.operator) === '--' || ref3 === '++') {
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
        var fragments, fst, ref3, shared;
        ref3 = this.first.second.cache(o), this.first.second = ref3[0], shared = ref3[1];
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
        var op, parts, ref3;
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
            if (((ref3 = this.first.base) != null ? ref3.value : void 0) !== '') {
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
        var hasSplat, j, len1, obj, ref3;
        if (this.array instanceof Value && this.array.isArray() && this.array.base.objects.length) {
            ref3 = this.array.base.objects;
            for (j = 0, len1 = ref3.length; j < len1; j++) {
                obj = ref3[j];
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
        var cmp, cnj, i, item, j, len1, ref, ref3, ref4, ref5, sub, tests;
        ref3 = this.object.cache(o, LEVEL_OP), sub = ref3[0], ref = ref3[1];
        ref4 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = ref4[0], cnj = ref4[1];
        tests = [];
        ref5 = this.array.base.objects;
        for (i = j = 0, len1 = ref5.length; j < len1; i = ++j) {
            item = ref5[i];
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
        var fragments, ref, ref3, sub;
        ref3 = this.object.cache(o, LEVEL_LIST), sub = ref3[0], ref = ref3[1];
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
        var ref3;
        return this.attempt.jumps(o) || ((ref3 = this.recovery) != null ? ref3.jumps(o) : void 0);
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
        var cmp, cnj, code, ref3;
        this.expression.front = this.front;
        code = this.expression.compile(o, LEVEL_OP);
        if (this.expression.unwrap() instanceof IdentifierLiteral && !o.scope.check(code)) {
            ref3 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = ref3[0], cnj = ref3[1];
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
        var ref3;
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
            ref3 = [this.index, this.name], this.name = ref3[0], this.index = ref3[1];
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
        var body, bodyFragments, compare, compareDown, declare, declareDown, defPart, defPartFragments, down, forPartFragments, guardPart, idt1, increment, index, ivar, kvar, kvarAssign, last, lvar, name, namePart, ref, ref3, ref4, resultPart, returnResult, rvar, scope, source, step, stepNum, stepVar, svar, varPart;
        body = Block.wrap([this.body]);
        ref3 = body.expressions, last = ref3[ref3.length - 1];
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
            ref4 = this.cacheToCodeFragments(this.step.cache(o, LEVEL_LIST, isComplexOrAssignable)), step = ref4[0], stepVar = ref4[1];
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
        var base, defs, expr, fn, idx, j, len1, ref, ref3, ref4, ref5, ref6, ref7, ref8, ref9, val;
        defs = [];
        ref3 = body.expressions;
        for (idx = j = 0, len1 = ref3.length; j < len1; idx = ++j) {
            expr = ref3[idx];
            expr = expr.unwrapAll();
            if (!(expr instanceof Call)) {
                continue;
            }
            val = (ref4 = expr.variable) != null ? ref4.unwrapAll() : void 0;
            if (!((val instanceof Code) || (val instanceof Value && ((ref5 = val.base) != null ? ref5.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((ref6 = (ref7 = val.properties[0].name) != null ? ref7.value : void 0) === 'call' || ref6 === 'apply')))) {
                continue;
            }
            fn = ((ref8 = val.base) != null ? ref8.unwrapAll() : void 0) || val;
            ref = new IdentifierLiteral(o.scope.freeVariable('fn'));
            base = new Value(ref);
            if (val.base) {
                ref9 = [base, val], val.base = ref9[0], base = ref9[1];
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
        var block, conds, j, jumpNode, len1, ref3, ref4, ref5;
        if (o == null) {
            o = {
                block: true
            };
        }
        ref3 = this.cases;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            ref4 = ref3[j], conds = ref4[0], block = ref4[1];
            if (jumpNode = block.jumps(o)) {
                return jumpNode;
            }
        }
        return (ref5 = this.otherwise) != null ? ref5.jumps(o) : void 0;
    };

    Switch.prototype.makeReturn = function(res) {
        var j, len1, pair, ref3, ref4;
        ref3 = this.cases;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            pair = ref3[j];
            pair[1].makeReturn(res);
        }
        if (res) {
            this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
        }
        if ((ref4 = this.otherwise) != null) {
            ref4.makeReturn(res);
        }
        return this;
    };

    Switch.prototype.compileNode = function(o) {
        var block, body, cond, conditions, expr, fragments, i, idt1, idt2, j, k, len1, len2, ref3, ref4, ref5;
        idt1 = o.indent + TAB;
        idt2 = o.indent = idt1 + TAB;
        fragments = [].concat(this.makeCode(this.tab + "switch ("), (this.subject ? this.subject.compileToFragments(o, LEVEL_PAREN) : this.makeCode("false")), this.makeCode(") {\n"));
        ref3 = this.cases;
        for (i = j = 0, len1 = ref3.length; j < len1; i = ++j) {
            ref4 = ref3[i], conditions = ref4[0], block = ref4[1];
            ref5 = flatten([conditions]);
            for (k = 0, len2 = ref5.length; k < len2; k++) {
                cond = ref5[k];
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
        var ref3;
        return (ref3 = this.body) != null ? ref3.unwrap() : void 0;
    };

    If.prototype.elseBodyNode = function() {
        var ref3;
        return (ref3 = this.elseBody) != null ? ref3.unwrap() : void 0;
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
        var ref3;
        return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((ref3 = this.elseBodyNode()) != null ? ref3.isStatement(o) : void 0);
    };

    If.prototype.jumps = function(o) {
        var ref3;
        return this.body.jumps(o) || ((ref3 = this.elseBody) != null ? ref3.jumps(o) : void 0);
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
        var ref3;
        if (this.isChain) {
            if ((ref3 = this.elseBody) != null) {
                ref3.unwrap().addElse(elseBody);
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
        var ref3;
        return this.body.jumps(o) || ((ref3 = this.elseBody) != null ? ref3.jumps(o) : void 0);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDh2Q0FBQTtJQUFBOzs7OztBQWFBLEtBQUssQ0FBQyxlQUFOLEdBQXdCOztBQUV0QixRQUFVLE9BQUEsQ0FBUSxTQUFSOztBQUNaLE9BQW1DLE9BQUEsQ0FBUSxTQUFSLENBQW5DLEVBQUUsb0NBQUYsRUFBa0I7O0FBRWxCLE9BQzJFLE9BQUEsQ0FBUSxXQUFSLENBRDNFLEVBQUUsc0JBQUYsRUFBVyxzQkFBWCxFQUFvQixvQkFBcEIsRUFBNEIsa0JBQTVCLEVBQW1DLGNBQW5DLEVBQXdDLG9CQUF4QyxFQUFnRCxnQkFBaEQsRUFBc0QsZ0JBQXRELEVBQTRELGtDQUE1RCxFQUEyRSw0QkFBM0UsRUFBdUYsNEJBQXZGLEVBQ0UsMENBREYsRUFDcUIsZ0RBRHJCLEVBQzJDLHdDQUQzQyxFQUM2RDs7QUFFM0QsZ0JBQWtCLE9BQUEsQ0FBUSxRQUFSOztBQUVwQixPQUFPLENBQUMsTUFBUixHQUFpQjs7QUFDakIsT0FBTyxDQUFDLGlCQUFSLEdBQTRCOztBQUU1QixHQUFBLEdBQVUsU0FBQTtXQUFHO0FBQUg7O0FBQ1YsRUFBQSxHQUFVLFNBQUE7V0FBRztBQUFIOztBQUNWLElBQUEsR0FBVSxTQUFBO1dBQUc7QUFBSDs7QUFDVixNQUFBLEdBQVUsU0FBQTtJQUFHLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBSSxJQUFDLENBQUE7V0FBUztBQUE1Qjs7QUFhVixPQUFPLENBQUMsWUFBUixHQUE2QjtJQUV0QixzQkFBQyxNQUFELEVBQVMsSUFBVDtBQUVDLFlBQUE7UUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLEVBQUEsR0FBRztRQUNYLElBQUMsQ0FBQSxZQUFELG9CQUFnQixNQUFNLENBQUU7UUFDeEIsSUFBQyxDQUFBLElBQUQsK0RBQTJCLENBQUUsdUJBQXJCLElBQTZCO0lBSnRDOzsyQkFNSCxRQUFBLEdBQVUs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TUFBTyxDQUFBLElBQUEsQ0FBUCxHQUFlLEdBQUcsQ0FBQztJQUNuQixHQUFHLENBQUMsSUFBSixHQUFXLElBQUksS0FBSixDQUFVLE1BQVY7V0FDWDtBQUpTIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiMjI1xuXG4jIENvbnRhaW5zIGFsbCBvZiB0aGUgbm9kZSBjbGFzc2VzIGZvciB0aGUgc3ludGF4IHRyZWUuIFxuIyBNb3N0IG5vZGVzIGFyZSBjcmVhdGVkIGFzIHRoZSByZXN1bHQgb2YgYWN0aW9ucyBpbiB0aGUgZ3JhbW1hcixcbiMgYnV0IHNvbWUgYXJlIGNyZWF0ZWQgYnkgb3RoZXIgbm9kZXMgYXMgYSBtZXRob2Qgb2YgY29kZSBnZW5lcmF0aW9uLiBcbiMgVG8gY29udmVydCB0aGUgc3ludGF4IHRyZWUgaW50byBhIHN0cmluZyBvZiBKYXZhU2NyaXB0IGNvZGUsIGNhbGwgYGNvbXBpbGUoKWAgb24gdGhlIHJvb3QuXG5cbkVycm9yLnN0YWNrVHJhY2VMaW1pdCA9IEluZmluaXR5XG5cbnsgU2NvcGUgfSA9IHJlcXVpcmUgJy4vc2NvcGUnXG57IGlzVW5hc3NpZ25hYmxlLCBKU19GT1JCSURERU4gfSA9IHJlcXVpcmUgJy4vbGV4ZXInXG5cbnsgY29tcGFjdCwgZmxhdHRlbiwgZXh0ZW5kLCBtZXJnZSwgZGVsLCBzdGFydHMsIGVuZHMsIHNvbWUsIGluamVjdEZlYXR1cmUsIGhhc0ZlYXR1cmUsIGluamVjdE1ldGEsXG4gIGFkZExvY2F0aW9uRGF0YUZuLCBsb2NhdGlvbkRhdGFUb1N0cmluZywgdGhyb3dTeW50YXhFcnJvciwgc3RyaW5naWZ5IH0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG5cbnsgY29tcGlsZU1ldGFJZiB9ID0gcmVxdWlyZSAnLi9tZXRhJ1xuICBcbmV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kXG5leHBvcnRzLmFkZExvY2F0aW9uRGF0YUZuID0gYWRkTG9jYXRpb25EYXRhRm5cblxuWUVTICAgICA9IC0+IHllc1xuTk8gICAgICA9IC0+IG5vXG5USElTICAgID0gLT4gdGhpc1xuTkVHQVRFICA9IC0+IEBuZWdhdGVkID0gbm90IEBuZWdhdGVkOyB0aGlzXG5cbiMgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuIyBUaGUgdmFyaW91cyBub2RlcyBkZWZpbmVkIGJlbG93IGFsbCBjb21waWxlIHRvIGEgY29sbGVjdGlvbiBvZiBDb2RlRnJhZ21lbnQgb2JqZWN0cy5cbiMgQSBDb2RlRnJhZ21lbnRzIGlzIGEgYmxvY2sgb2YgZ2VuZXJhdGVkIGNvZGUsIGFuZCB0aGUgbG9jYXRpb24gaW4gdGhlIHNvdXJjZSBmaWxlIHdoZXJlIHRoZSBjb2RlXG4jIGNhbWUgZnJvbS4gQ29kZUZyYWdtZW50cyBjYW4gYmUgYXNzZW1ibGVkIHRvZ2V0aGVyIGludG8gd29ya2luZyBjb2RlIGp1c3QgYnkgY2F0dGluZyB0b2dldGhlclxuIyBhbGwgdGhlIENvZGVGcmFnbWVudHMnIGBjb2RlYCBzbmlwcGV0cywgaW4gb3JkZXIuXG5cbmV4cG9ydHMuQ29kZUZyYWdtZW50ID0gY2xhc3MgQ29kZUZyYWdtZW50XG4gICAgXG4gICAgQDogKHBhcmVudCwgY29kZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBjb2RlID0gXCIje2NvZGV9XCJcbiAgICAgICAgQGxvY2F0aW9uRGF0YSA9IHBhcmVudD8ubG9jYXRpb25EYXRhXG4gICAgICAgIEB0eXBlID0gcGFyZW50Py5jb25zdHJ1Y3Rvcj8ubmFtZSBvciAndW5rbm93bidcblxuICAgIHRvU3RyaW5nOiAtPlxuICAgICAgICBcbiAgICAgICAgXCIje0Bjb2RlfSN7aWYgQGxvY2F0aW9uRGF0YSB0aGVuIFwiOiBcIiArIGxvY2F0aW9uRGF0YVRvU3RyaW5nKEBsb2NhdGlvbkRhdGEpIGVsc2UgJyd9XCJcblxuIyAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbiMgVGhlICoqQmFzZSoqIGlzIHRoZSBhYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBhbGwgbm9kZXMgaW4gdGhlIHN5bnRheCB0cmVlLlxuIyBFYWNoIHN1YmNsYXNzIGltcGxlbWVudHMgdGhlIGBjb21waWxlTm9kZWAgbWV0aG9kLCB3aGljaCBwZXJmb3JtcyB0aGVcbiMgY29kZSBnZW5lcmF0aW9uIGZvciB0aGF0IG5vZGUuIFRvIGNvbXBpbGUgYSBub2RlIHRvIEphdmFTY3JpcHQsXG4jIGNhbGwgYGNvbXBpbGVgIG9uIGl0LCB3aGljaCB3cmFwcyBgY29tcGlsZU5vZGVgIGluIHNvbWUgZ2VuZXJpYyBleHRyYSBzbWFydHMsXG4jIHRvIGtub3cgd2hlbiB0aGUgZ2VuZXJhdGVkIGNvZGUgbmVlZHMgdG8gYmUgd3JhcHBlZCB1cCBpbiBhIGNsb3N1cmUuXG4jIEFuIG9wdGlvbnMgaGFzaCBpcyBwYXNzZWQgYW5kIGNsb25lZCB0aHJvdWdob3V0LCBjb250YWluaW5nIGluZm9ybWF0aW9uIGFib3V0XG4jIHRoZSBlbnZpcm9ubWVudCBmcm9tIGhpZ2hlciBpbiB0aGUgdHJlZSAoc3VjaCBhcyBpZiBhIHJldHVybmVkIHZhbHVlIGlzXG4jIGJlaW5nIHJlcXVlc3RlZCBieSB0aGUgc3Vycm91bmRpbmcgZnVuY3Rpb24pLCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudFxuIyBzY29wZSwgYW5kIGluZGVudGF0aW9uIGxldmVsLlxuXG5leHBvcnRzLkJhc2UgPSBjbGFzcyBCYXNlXG5cbiAgICBmcmFnbWVudHNUb1RleHQ6IChmcmFnbWVudHMpIC0+ICMgQ29udmVydCBhbiBhcnJheSBvZiBDb2RlRnJhZ21lbnRzIGludG8gYSBzdHJpbmcuXG4gICAgXG4gICAgICAgIChmcmFnbWVudC5jb2RlIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHMpLmpvaW4oJycpXG4gICAgXG4gICAgY29tcGlsZTogKG8sIGx2bCkgLT4gQGZyYWdtZW50c1RvVGV4dCBAY29tcGlsZVRvRnJhZ21lbnRzIG8sIGx2bFxuXG4gICAgIyBDb21tb24gbG9naWMgZm9yIGRldGVybWluaW5nIHdoZXRoZXIgdG8gd3JhcCB0aGlzIG5vZGUgaW4gYSBjbG9zdXJlIGJlZm9yZSBjb21waWxpbmcgaXQsIG9yIHRvIGNvbXBpbGUgZGlyZWN0bHkuIFxuICAgICMgV2UgbmVlZCB0byB3cmFwIGlmIHRoaXMgbm9kZSBpcyBhIHN0YXRlbWVudCwgYW5kIGl0J3Mgbm90IGEgcHVyZVN0YXRlbWVudCwgYW5kIHdlJ3JlIG5vdCBhdCB0aGUgdG9wIGxldmVsIG9mIGEgYmxvY2sgKHdoaWNoIHdvdWxkIGJlIHVubmVjZXNzYXJ5KSwgXG4gICAgIyBhbmQgd2UgaGF2ZW4ndCBhbHJlYWR5IGJlZW4gYXNrZWQgdG8gcmV0dXJuIHRoZSByZXN1bHQgKGJlY2F1c2Ugc3RhdGVtZW50cyBrbm93IGhvdyB0byByZXR1cm4gcmVzdWx0cykuXG4gICAgXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobywgbHZsKSAtPlxuICAgICAgICBcbiAgICAgICAgbyA9IGluamVjdEZlYXR1cmUgb1xuICAgICAgICBvID0gaW5qZWN0TWV0YSAgICBvXG4gICAgICAgICMgbG9nICdjb21waWxlVG9GcmFnbWVudHMnLCBvLmxldmVsXG4gICAgICAgIG8ubGV2ZWwgID0gbHZsIGlmIGx2bFxuICAgICAgICBub2RlICAgICA9IEB1bmZvbGRTb2FrKG8pIG9yIHRoaXNcbiAgICAgICAgbm9kZS50YWIgPSBvLmluZGVudFxuICAgICAgICBpZiBvLmxldmVsIGlzIExFVkVMX1RPUCBvciBub3Qgbm9kZS5pc1N0YXRlbWVudChvKVxuICAgICAgICAgICAgbm9kZS5jb21waWxlTm9kZSBvXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vZGUuY29tcGlsZUNsb3N1cmUgb1xuXG4gICAgIyBTdGF0ZW1lbnRzIGNvbnZlcnRlZCBpbnRvIGV4cHJlc3Npb25zIHZpYSBjbG9zdXJlLXdyYXBwaW5nIHNoYXJlIGEgc2NvcGVcbiAgICAjIG9iamVjdCB3aXRoIHRoZWlyIHBhcmVudCBjbG9zdXJlLCB0byBwcmVzZXJ2ZSB0aGUgZXhwZWN0ZWQgbGV4aWNhbCBzY29wZS5cbiAgICBcbiAgICBjb21waWxlQ2xvc3VyZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBqdW1wTm9kZSA9IEBqdW1wcygpXG4gICAgICAgICAgICBqdW1wTm9kZS5lcnJvciAnY2Fubm90IHVzZSBhIHB1cmUgc3RhdGVtZW50IGluIGFuIGV4cHJlc3Npb24nXG4gICAgICAgIG8uc2hhcmVkU2NvcGUgPSB5ZXNcbiAgICAgICAgZnVuYyA9IG5ldyBDb2RlIFtdLCBCbG9jay53cmFwIFt0aGlzXVxuICAgICAgICBhcmdzID0gW11cbiAgICAgICAgaWYgKGFyZ3VtZW50c05vZGUgPSBAY29udGFpbnMgaXNMaXRlcmFsQXJndW1lbnRzKSBvciBAY29udGFpbnMgaXNMaXRlcmFsVGhpc1xuICAgICAgICAgICAgYXJncyA9IFtuZXcgVGhpc0xpdGVyYWxdXG4gICAgICAgICAgICBpZiBhcmd1bWVudHNOb2RlXG4gICAgICAgICAgICAgICAgbWV0aCA9ICdhcHBseSdcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2ggbmV3IElkZW50aWZpZXJMaXRlcmFsICdhcmd1bWVudHMnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWV0aCA9ICdjYWxsJ1xuICAgICAgICAgICAgZnVuYyA9IG5ldyBWYWx1ZSBmdW5jLCBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lIG1ldGhdXG4gICAgICAgIHBhcnRzID0gKG5ldyBDYWxsIGZ1bmMsIGFyZ3MpLmNvbXBpbGVOb2RlIG9cbiAgICAgICAgaWYgZnVuYy5pc0dlbmVyYXRvciBvciBmdW5jLmJhc2U/LmlzR2VuZXJhdG9yXG4gICAgICAgICAgICBwYXJ0cy51bnNoaWZ0IEBtYWtlQ29kZSBcIih5aWVsZCogXCJcbiAgICAgICAgICAgIHBhcnRzLnB1c2ggICAgQG1ha2VDb2RlIFwiKVwiXG4gICAgICAgIHBhcnRzXG5cbiAgICAjIElmIHRoZSBjb2RlIGdlbmVyYXRpb24gd2lzaGVzIHRvIHVzZSB0aGUgcmVzdWx0IG9mIGEgY29tcGxleCBleHByZXNzaW9uXG4gICAgIyBpbiBtdWx0aXBsZSBwbGFjZXMsIGVuc3VyZSB0aGF0IHRoZSBleHByZXNzaW9uIGlzIG9ubHkgZXZlciBldmFsdWF0ZWQgb25jZSxcbiAgICAjIGJ5IGFzc2lnbmluZyBpdCB0byBhIHRlbXBvcmFyeSB2YXJpYWJsZS4gUGFzcyBhIGxldmVsIHRvIHByZWNvbXBpbGUuXG4gICAgI1xuICAgICMgSWYgYGxldmVsYCBpcyBwYXNzZWQsIHRoZW4gcmV0dXJucyBgW3ZhbCwgcmVmXWAsIHdoZXJlIGB2YWxgIGlzIHRoZSBjb21waWxlZCB2YWx1ZSwgYW5kIGByZWZgXG4gICAgIyBpcyB0aGUgY29tcGlsZWQgcmVmZXJlbmNlLiBJZiBgbGV2ZWxgIGlzIG5vdCBwYXNzZWQsIHRoaXMgcmV0dXJucyBgW3ZhbCwgcmVmXWAgd2hlcmVcbiAgICAjIHRoZSB0d28gdmFsdWVzIGFyZSByYXcgbm9kZXMgd2hpY2ggaGF2ZSBub3QgYmVlbiBjb21waWxlZC5cbiAgICBcbiAgICBjYWNoZTogKG8sIGxldmVsLCBpc0NvbXBsZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBjb21wbGV4ID0gaWYgaXNDb21wbGV4PyB0aGVuIGlzQ29tcGxleCB0aGlzIGVsc2UgQGlzQ29tcGxleCgpXG4gICAgICAgIGlmIGNvbXBsZXhcbiAgICAgICAgICAgIHJlZiA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ1xuICAgICAgICAgICAgc3ViID0gbmV3IEFzc2lnbiByZWYsIHRoaXNcbiAgICAgICAgICAgIGlmIGxldmVsIHRoZW4gW3N1Yi5jb21waWxlVG9GcmFnbWVudHMobywgbGV2ZWwpLCBbQG1ha2VDb2RlKHJlZi52YWx1ZSldXSBlbHNlIFtzdWIsIHJlZl1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVmID0gaWYgbGV2ZWwgdGhlbiBAY29tcGlsZVRvRnJhZ21lbnRzIG8sIGxldmVsIGVsc2UgdGhpc1xuICAgICAgICAgICAgW3JlZiwgcmVmXVxuXG4gICAgY2FjaGVUb0NvZGVGcmFnbWVudHM6IChjYWNoZVZhbHVlcykgLT5cbiAgICAgICAgXG4gICAgICAgIFtAZnJhZ21lbnRzVG9UZXh0KGNhY2hlVmFsdWVzWzBdKSwgQGZyYWdtZW50c1RvVGV4dChjYWNoZVZhbHVlc1sxXSldXG5cbiAgICAjIENvbnN0cnVjdCBhIG5vZGUgdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IG5vZGUncyByZXN1bHQuXG4gICAgIyBUaGlzIGlzIG92ZXJyaWRkZW4gZm9yIHNtYXJ0ZXIgYmVoYXZpb3IgZm9yIG1hbnkgc3RhdGVtZW50IG5vZGVzIChlLmcuIElmLCBGb3IpLi4uXG4gICAgXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgbWUgPSBAdW53cmFwQWxsKClcbiAgICAgICAgaWYgcmVzXG4gICAgICAgICAgICBuZXcgQ2FsbCBuZXcgTGl0ZXJhbChcIiN7cmVzfS5wdXNoXCIpLCBbbWVdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5ldyBSZXR1cm4gbWVcblxuICAgICMgRG9lcyB0aGlzIG5vZGUsIG9yIGFueSBvZiBpdHMgY2hpbGRyZW4sIGNvbnRhaW4gYSBub2RlIG9mIGEgY2VydGFpbiBraW5kP1xuICAgICMgUmVjdXJzaXZlbHkgdHJhdmVyc2VzIGRvd24gdGhlICpjaGlsZHJlbiogbm9kZXMgYW5kIHJldHVybnMgdGhlIGZpcnN0IG9uZVxuICAgICMgdGhhdCB2ZXJpZmllcyBgcHJlZGAuIE90aGVyd2lzZSByZXR1cm4gdW5kZWZpbmVkLiBgY29udGFpbnNgIGRvZXMgbm90IGNyb3NzXG4gICAgIyBzY29wZSBib3VuZGFyaWVzLlxuICAgIFxuICAgIGNvbnRhaW5zOiAocHJlZCkgLT5cbiAgICAgICAgbm9kZSA9IHVuZGVmaW5lZFxuICAgICAgICBAdHJhdmVyc2VDaGlsZHJlbiBubywgKG4pIC0+XG4gICAgICAgICAgICBpZiBwcmVkIG5cbiAgICAgICAgICAgICAgICBub2RlID0gblxuICAgICAgICAgICAgICAgIHJldHVybiBub1xuICAgICAgICBub2RlXG5cbiAgICBsYXN0Tm9uQ29tbWVudDogKGxpc3QpIC0+ICMgUHVsbCBvdXQgdGhlIGxhc3Qgbm9uLWNvbW1lbnQgbm9kZSBvZiBhIG5vZGUgbGlzdC5cbiAgICAgICAgaSA9IGxpc3QubGVuZ3RoXG4gICAgICAgIHJldHVybiBsaXN0W2ldIHdoaWxlIGktLSB3aGVuIGxpc3RbaV0gbm90IGluc3RhbmNlb2YgQ29tbWVudFxuICAgICAgICBudWxsXG5cbiAgICAjIGB0b1N0cmluZ2AgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5vZGUsIGZvciBpbnNwZWN0aW5nIHRoZSBwYXJzZSB0cmVlLlxuICAgICMgVGhpcyBpcyB3aGF0IGBjb2ZmZWUgLS1ub2Rlc2AgcHJpbnRzIG91dC5cbiAgICBcbiAgICB0b1N0cmluZzogKGlkdCA9ICcnLCBuYW1lID0gQGNvbnN0cnVjdG9yLm5hbWUpIC0+XG4gICAgICAgIHRyZWUgPSAnXFxuJyArIGlkdCArIG5hbWVcbiAgICAgICAgdHJlZSArPSAnPycgaWYgQHNvYWtcbiAgICAgICAgQGVhY2hDaGlsZCAobm9kZSkgLT4gdHJlZSArPSBub2RlLnRvU3RyaW5nIGlkdCArIFRBQlxuICAgICAgICB0cmVlXG5cbiAgICAjIFBhc3NlcyBlYWNoIGNoaWxkIHRvIGEgZnVuY3Rpb24sIGJyZWFraW5nIHdoZW4gdGhlIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYC5cbiAgICBcbiAgICBlYWNoQ2hpbGQ6IChmdW5jKSAtPlxuICAgICAgICByZXR1cm4gdGhpcyB1bmxlc3MgQGNoaWxkcmVuXG4gICAgICAgIGZvciBhdHRyIGluIEBjaGlsZHJlbiB3aGVuIEBbYXR0cl1cbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBmbGF0dGVuIFtAW2F0dHJdXVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzIGlmIGZ1bmMoY2hpbGQpIGlzIGZhbHNlXG4gICAgICAgIHRoaXNcblxuICAgIHRyYXZlcnNlQ2hpbGRyZW46IChjcm9zc1Njb3BlLCBmdW5jKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVhY2hDaGlsZCAoY2hpbGQpIC0+XG4gICAgICAgICAgICByZWN1ciA9IGZ1bmMoY2hpbGQpXG4gICAgICAgICAgICBjaGlsZC50cmF2ZXJzZUNoaWxkcmVuKGNyb3NzU2NvcGUsIGZ1bmMpIHVubGVzcyByZWN1ciBpcyBub1xuXG4gICAgaW52ZXJ0OiAtPlxuICAgICAgICBuZXcgT3AgJyEnLCB0aGlzXG5cbiAgICB1bndyYXBBbGw6IC0+XG4gICAgICAgIG5vZGUgPSB0aGlzXG4gICAgICAgIGNvbnRpbnVlIHVudGlsIG5vZGUgaXMgbm9kZSA9IG5vZGUudW53cmFwKClcbiAgICAgICAgbm9kZVxuXG4gICAgIyBEZWZhdWx0IGltcGxlbWVudGF0aW9ucyBvZiB0aGUgY29tbW9uIG5vZGUgcHJvcGVydGllcyBhbmQgbWV0aG9kcy4gTm9kZXNcbiAgICAjIHdpbGwgb3ZlcnJpZGUgdGhlc2Ugd2l0aCBjdXN0b20gbG9naWMsIGlmIG5lZWRlZC5cbiAgICBcbiAgICBjaGlsZHJlbjogICAgIFtdXG4gICAgaXNTdGF0ZW1lbnQ6ICBOT1xuICAgIGp1bXBzOiAgICAgICAgTk9cbiAgICBpc0NvbXBsZXg6ICAgIFlFU1xuICAgIGlzQ2hhaW5hYmxlOiAgTk9cbiAgICBpc0Fzc2lnbmFibGU6IE5PXG4gICAgaXNOdW1iZXI6ICAgICBOT1xuICAgIHVud3JhcDogICAgICAgVEhJU1xuICAgIHVuZm9sZFNvYWs6ICAgTk9cblxuICAgIGFzc2lnbnM6ICAgICAgTk8gIyBJcyB0aGlzIG5vZGUgdXNlZCB0byBhc3NpZ24gYSBjZXJ0YWluIHZhcmlhYmxlP1xuXG4gICAgIyBGb3IgdGhpcyBub2RlIGFuZCBhbGwgZGVzY2VuZGVudHMsIHNldCB0aGUgbG9jYXRpb24gZGF0YSB0byBgbG9jYXRpb25EYXRhYFxuICAgICMgaWYgdGhlIGxvY2F0aW9uIGRhdGEgaXMgbm90IGFscmVhZHkgc2V0LlxuICAgIFxuICAgIHVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZzogKGxvY2F0aW9uRGF0YSkgLT5cbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQGxvY2F0aW9uRGF0YVxuICAgICAgICBAbG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhXG5cbiAgICAgICAgQGVhY2hDaGlsZCAoY2hpbGQpIC0+XG4gICAgICAgICAgICBjaGlsZC51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgbG9jYXRpb25EYXRhXG5cbiAgICBlcnJvcjogKG1lc3NhZ2UpIC0+ICMgVGhyb3cgYSBTeW50YXhFcnJvciBhc3NvY2lhdGVkIHdpdGggdGhpcyBub2RlJ3MgbG9jYXRpb24uXG4gICAgICAgIFxuICAgICAgICB0aHJvd1N5bnRheEVycm9yIG1lc3NhZ2UsIEBsb2NhdGlvbkRhdGFcblxuICAgIG1ha2VDb2RlOiAoY29kZSkgLT5cbiAgICAgICAgbmV3IENvZGVGcmFnbWVudCB0aGlzLCBjb2RlXG5cbiAgICB3cmFwSW5CcmFjZXM6IChmcmFnbWVudHMpIC0+XG4gICAgICAgIFtdLmNvbmNhdCBAbWFrZUNvZGUoJygnKSwgZnJhZ21lbnRzLCBAbWFrZUNvZGUoJyknKVxuXG4gICAgIyBgZnJhZ21lbnRzTGlzdGAgaXMgYW4gYXJyYXkgb2YgYXJyYXlzIG9mIGZyYWdtZW50cy4gRWFjaCBhcnJheSBpbiBmcmFnbWVudHNMaXN0IHdpbGwgYmVcbiAgICAjIGNvbmNhdG9uYXRlZCB0b2dldGhlciwgd2l0aCBgam9pblN0cmAgYWRkZWQgaW4gYmV0d2VlbiBlYWNoLCB0byBwcm9kdWNlIGEgZmluYWwgZmxhdCBhcnJheVxuICAgICMgb2YgZnJhZ21lbnRzLlxuICAgIFxuICAgIGpvaW5GcmFnbWVudEFycmF5czogKGZyYWdtZW50c0xpc3QsIGpvaW5TdHIpIC0+XG4gICAgICAgIGFuc3dlciA9IFtdXG4gICAgICAgIGZvciBmcmFnbWVudHMsaSBpbiBmcmFnbWVudHNMaXN0XG4gICAgICAgICAgICBpZiBpIHRoZW4gYW5zd2VyLnB1c2ggQG1ha2VDb2RlIGpvaW5TdHJcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgZnJhZ21lbnRzXG4gICAgICAgIGFuc3dlclxuXG4jIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFRoZSBibG9jayBpcyB0aGUgbGlzdCBvZiBleHByZXNzaW9ucyB0aGF0IGZvcm1zIHRoZSBib2R5IG9mIGFuIGluZGVudGVkIGJsb2NrIG9mIGNvZGUgXG4jIC0tIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGZ1bmN0aW9uLCBhIGNsYXVzZSBpbiBhbiBgaWZgLCBgc3dpdGNoYCwgb3IgYHRyeWAsIGFuZCBzbyBvbi4uLlxuXG5leHBvcnRzLkJsb2NrID0gY2xhc3MgQmxvY2sgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKG5vZGVzKSAtPiBAZXhwcmVzc2lvbnMgPSBjb21wYWN0IGZsYXR0ZW4gbm9kZXMgb3IgW11cblxuICAgIGNoaWxkcmVuOiBbJ2V4cHJlc3Npb25zJ11cblxuICAgIHB1c2g6IChub2RlKSAtPiAjIFRhY2sgYW4gZXhwcmVzc2lvbiBvbiB0byB0aGUgZW5kIG9mIHRoaXMgZXhwcmVzc2lvbiBsaXN0LlxuICAgICAgICBcbiAgICAgICAgQGV4cHJlc3Npb25zLnB1c2ggbm9kZVxuICAgICAgICB0aGlzXG5cbiAgICBwb3A6IC0+ICMgUmVtb3ZlIGFuZCByZXR1cm4gdGhlIGxhc3QgZXhwcmVzc2lvbiBvZiB0aGlzIGV4cHJlc3Npb24gbGlzdC5cbiAgICAgICAgXG4gICAgICAgIEBleHByZXNzaW9ucy5wb3AoKVxuXG4gICAgdW5zaGlmdDogKG5vZGUpIC0+ICMgQWRkIGFuIGV4cHJlc3Npb24gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGlzIGV4cHJlc3Npb24gbGlzdC5cbiAgICAgICAgXG4gICAgICAgIEBleHByZXNzaW9ucy51bnNoaWZ0IG5vZGVcbiAgICAgICAgdGhpc1xuXG4gICAgIyBJZiB0aGlzIEJsb2NrIGNvbnNpc3RzIG9mIGp1c3QgYSBzaW5nbGUgbm9kZSwgdW53cmFwIGl0IGJ5IHB1bGxpbmcgaXQgYmFjayBvdXQuXG4gICAgXG4gICAgdW53cmFwOiAtPlxuICAgICAgICBpZiBAZXhwcmVzc2lvbnMubGVuZ3RoIGlzIDEgdGhlbiBAZXhwcmVzc2lvbnNbMF0gZWxzZSB0aGlzXG5cbiAgICBpc0VtcHR5OiAtPiAjIElzIHRoaXMgYW4gZW1wdHkgYmxvY2sgb2YgY29kZT9cbiAgICAgICAgbm90IEBleHByZXNzaW9ucy5sZW5ndGhcblxuICAgIGlzU3RhdGVtZW50OiAobykgLT5cbiAgICAgICAgZm9yIGV4cCBpbiBAZXhwcmVzc2lvbnMgd2hlbiBleHAuaXNTdGF0ZW1lbnQgb1xuICAgICAgICAgICAgcmV0dXJuIHllc1xuICAgICAgICBub1xuXG4gICAganVtcHM6IChvKSAtPlxuICAgICAgICBmb3IgZXhwIGluIEBleHByZXNzaW9uc1xuICAgICAgICAgICAgcmV0dXJuIGp1bXBOb2RlIGlmIGp1bXBOb2RlID0gZXhwLmp1bXBzIG9cblxuICAgICMgQSBCbG9jayBub2RlIGRvZXMgbm90IHJldHVybiBpdHMgZW50aXJlIGJvZHksIHJhdGhlciBpdCBlbnN1cmVzIHRoYXQgdGhlIGZpbmFsIGV4cHJlc3Npb24gaXMgcmV0dXJuZWQuXG4gICAgXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgXG4gICAgICAgIGxlbiA9IEBleHByZXNzaW9ucy5sZW5ndGhcbiAgICAgICAgd2hpbGUgbGVuLS1cbiAgICAgICAgICAgIGV4cHIgPSBAZXhwcmVzc2lvbnNbbGVuXVxuICAgICAgICAgICAgaWYgZXhwciBub3QgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgQGV4cHJlc3Npb25zW2xlbl0gPSBleHByLm1ha2VSZXR1cm4gcmVzXG4gICAgICAgICAgICAgICAgQGV4cHJlc3Npb25zLnNwbGljZShsZW4sIDEpIGlmIGV4cHIgaW5zdGFuY2VvZiBSZXR1cm4gYW5kIG5vdCBleHByLmV4cHJlc3Npb25cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICB0aGlzXG5cbiAgICAjIEEgQmxvY2sgaXMgdGhlIG9ubHkgbm9kZSB0aGF0IGNhbiBzZXJ2ZSBhcyB0aGUgcm9vdC5cbiAgICBcbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvID0ge30sIGxldmVsKSAtPlxuICAgICAgICBpZiBvLnNjb3BlIHRoZW4gc3VwZXIgbywgbGV2ZWwgZWxzZSBAY29tcGlsZVJvb3Qgb1xuXG4gICAgIyBDb21waWxlIGFsbCBleHByZXNzaW9ucyB3aXRoaW4gdGhlIEJsb2NrIGJvZHkuIFxuICAgICMgSWYgd2UgbmVlZCB0byByZXR1cm4gdGhlIHJlc3VsdCwgYW5kIGl0J3MgYW4gZXhwcmVzc2lvbiwgc2ltcGx5IHJldHVybiBpdC4gXG4gICAgIyBJZiBpdCdzIGEgc3RhdGVtZW50LCBhc2sgdGhlIHN0YXRlbWVudCB0byBkbyBzby5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBAdGFiID0gby5pbmRlbnRcbiAgICAgICAgdG9wICA9IG8ubGV2ZWwgaXMgTEVWRUxfVE9QXG4gICAgICAgIGNvbXBpbGVkTm9kZXMgPSBbXVxuXG4gICAgICAgIGZvciBub2RlLCBpbmRleCBpbiBAZXhwcmVzc2lvbnNcblxuICAgICAgICAgICAgbm9kZSA9IG5vZGUudW53cmFwQWxsKClcbiAgICAgICAgICAgIG5vZGUgPSAobm9kZS51bmZvbGRTb2FrKG8pIG9yIG5vZGUpXG4gICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgICAgICAjIFRoaXMgaXMgYSBuZXN0ZWQgYmxvY2suIFdlIGRvbid0IGRvIGFueXRoaW5nIHNwZWNpYWwgaGVyZSBsaWtlIGVuY2xvc2UgaXQgaW4gYSBuZXcgc2NvcGUuXG4gICAgICAgICAgICAgICAgIyBXZSBqdXN0IGNvbXBpbGUgdGhlIHN0YXRlbWVudHMgaW4gdGhpcyBibG9jayBhbG9uZyB3aXRoIG91ciBvd25cbiAgICAgICAgICAgICAgICBjb21waWxlZE5vZGVzLnB1c2ggbm9kZS5jb21waWxlTm9kZSBvXG4gICAgICAgICAgICBlbHNlIGlmIHRvcFxuICAgICAgICAgICAgICAgIG5vZGUuZnJvbnQgPSB0cnVlXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzID0gbm9kZS5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICAgICAgICAgIHVubGVzcyBub2RlLmlzU3RhdGVtZW50IG9cbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnVuc2hpZnQgQG1ha2VDb2RlIFwiI3tAdGFifVwiXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIjtcIlxuICAgICAgICAgICAgICAgIGNvbXBpbGVkTm9kZXMucHVzaCBmcmFnbWVudHNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb21waWxlZE5vZGVzLnB1c2ggbm9kZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICBpZiB0b3BcbiAgICAgICAgICAgIGlmIEBzcGFjZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IEBqb2luRnJhZ21lbnRBcnJheXMoY29tcGlsZWROb2RlcywgJ1xcblxcbicpLCBAbWFrZUNvZGUoXCJcXG5cIilcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gQGpvaW5GcmFnbWVudEFycmF5cyhjb21waWxlZE5vZGVzLCAnXFxuJylcbiAgICAgICAgaWYgY29tcGlsZWROb2Rlcy5sZW5ndGhcbiAgICAgICAgICAgIGFuc3dlciA9IEBqb2luRnJhZ21lbnRBcnJheXMoY29tcGlsZWROb2RlcywgJywgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyID0gW0BtYWtlQ29kZSBcInZvaWQgMFwiXVxuICAgICAgICBpZiBjb21waWxlZE5vZGVzLmxlbmd0aCA+IDEgYW5kIG8ubGV2ZWwgPj0gTEVWRUxfTElTVCB0aGVuIEB3cmFwSW5CcmFjZXMgYW5zd2VyIGVsc2UgYW5zd2VyXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgIyBJZiB3ZSBoYXBwZW4gdG8gYmUgdGhlIHRvcC1sZXZlbCBCbG9jaywgd3JhcCBldmVyeXRoaW5nIGluIGEgc2FmZXR5IGNsb3N1cmUsIHVubGVzcyByZXF1ZXN0ZWQgbm90IHRvLlxuICAgICMgSXQgd291bGQgYmUgYmV0dGVyIG5vdCB0byBnZW5lcmF0ZSB0aGVtIGluIHRoZSBmaXJzdCBwbGFjZSwgYnV0IGZvciBub3csIGNsZWFuIHVwIG9idmlvdXMgZG91YmxlLXBhcmVudGhlc2VzLlxuICAgIFxuICAgIGNvbXBpbGVSb290OiAobykgLT5cbiAgICAgICAgXG4gICAgICAgICMgbzIgPSBPYmplY3QuYXNzaWduIHt9LCBvXG4gICAgICAgICMgZGVsZXRlIG8yLnJlZmVyZW5jZWRWYXJzIFxuICAgICAgICAjIGxvZyAnQmxvY2suY29tcGlsZVJvb3QnLCBvMlxuICAgICAgICBcbiAgICAgICAgby5pbmRlbnQgPSBpZiBvLmJhcmUgdGhlbiAnJyBlbHNlIFRBQlxuICAgICAgICBvLmxldmVsICA9IExFVkVMX1RPUFxuICAgICAgICBAc3BhY2VkICA9IHllc1xuICAgICAgICBvLnNjb3BlICA9IG5ldyBTY29wZSBudWxsLCB0aGlzLCBudWxsLCBvLnJlZmVyZW5jZWRWYXJzID8gW11cbiAgICAgICAgXG4gICAgICAgICMgTWFyayBnaXZlbiBsb2NhbCB2YXJpYWJsZXMgaW4gdGhlIHJvb3Qgc2NvcGUgYXMgcGFyYW1ldGVycyBzbyB0aGV5IGRvbid0IGVuZCB1cCBiZWluZyBkZWNsYXJlZCBvbiB0aGlzIGJsb2NrLlxuICAgICAgICBcbiAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgbmFtZSBmb3IgbmFtZSBpbiBvLmxvY2FscyBvciBbXVxuICAgICAgICBwcmVsdWRlID0gW11cbiAgICAgICAgaWYgbm90IG8uYmFyZVxuICAgICAgICAgICAgcHJlbHVkZUV4cHMgPSBmb3IgZXhwLCBpIGluIEBleHByZXNzaW9uc1xuICAgICAgICAgICAgICAgIGJyZWFrIHVubGVzcyBleHAudW53cmFwKCkgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgZXhwXG4gICAgICAgICAgICByZXN0ID0gQGV4cHJlc3Npb25zW3ByZWx1ZGVFeHBzLmxlbmd0aC4uLl1cbiAgICAgICAgICAgIEBleHByZXNzaW9ucyA9IHByZWx1ZGVFeHBzXG4gICAgICAgICAgICBpZiBwcmVsdWRlRXhwcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwcmVsdWRlID0gQGNvbXBpbGVOb2RlIG1lcmdlKG8sIGluZGVudDogJycpXG4gICAgICAgICAgICAgICAgcHJlbHVkZS5wdXNoIEBtYWtlQ29kZSBcIlxcblwiXG4gICAgICAgICAgICBAZXhwcmVzc2lvbnMgPSByZXN0XG4gICAgICAgIGZyYWdtZW50cyA9IEBjb21waWxlV2l0aERlY2xhcmF0aW9ucyBvXG4gICAgICAgIHJldHVybiBmcmFnbWVudHMgaWYgby5iYXJlXG4gICAgICAgIFtdLmNvbmNhdCBwcmVsdWRlLCBAbWFrZUNvZGUoXCIoZnVuY3Rpb24oKSB7XFxuXCIpLCBmcmFnbWVudHMsIEBtYWtlQ29kZShcIlxcbn0pLmNhbGwodGhpcyk7XFxuXCIpXG5cbiAgICAjIENvbXBpbGUgdGhlIGV4cHJlc3Npb25zIGJvZHkgZm9yIHRoZSBjb250ZW50cyBvZiBhIGZ1bmN0aW9uLCB3aXRoIGRlY2xhcmF0aW9ucyBvZiBhbGwgaW5uZXIgdmFyaWFibGVzIHB1c2hlZCB1cCB0byB0aGUgdG9wLlxuICAgIFxuICAgIGNvbXBpbGVXaXRoRGVjbGFyYXRpb25zOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIGZyYWdtZW50cyA9IFtdXG4gICAgICAgIHBvc3QgPSBbXVxuICAgICAgICBmb3IgZXhwLCBpIGluIEBleHByZXNzaW9uc1xuICAgICAgICAgICAgZXhwID0gZXhwLnVud3JhcCgpXG4gICAgICAgICAgICBicmVhayB1bmxlc3MgZXhwIGluc3RhbmNlb2YgQ29tbWVudCBvciBleHAgaW5zdGFuY2VvZiBMaXRlcmFsXG4gICAgICAgIG8gPSBtZXJnZShvLCBsZXZlbDogTEVWRUxfVE9QKVxuICAgICAgICBpZiBpXG4gICAgICAgICAgICByZXN0ID0gQGV4cHJlc3Npb25zLnNwbGljZSBpLCA5ZTlcbiAgICAgICAgICAgIFtzcGFjZWQsICAgICAgICBAc3BhY2VkXSA9IFtAc3BhY2VkLCBub11cbiAgICAgICAgICAgIFtmcmFnbWVudHMsIEBzcGFjZWRdID0gW0Bjb21waWxlTm9kZShvKSwgc3BhY2VkXVxuICAgICAgICAgICAgQGV4cHJlc3Npb25zID0gcmVzdFxuICAgICAgICBwb3N0ID0gQGNvbXBpbGVOb2RlIG9cbiAgICAgICAge3Njb3BlfSA9IG9cbiAgICAgICAgaWYgc2NvcGUuZXhwcmVzc2lvbnMgaXMgdGhpc1xuICAgICAgICAgICAgZGVjbGFycyA9IG8uc2NvcGUuaGFzRGVjbGFyYXRpb25zKClcbiAgICAgICAgICAgIGFzc2lnbnMgPSBzY29wZS5oYXNBc3NpZ25tZW50c1xuICAgICAgICAgICAgaWYgZGVjbGFycyBvciBhc3NpZ25zXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdcXG4nIGlmIGlcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIje0B0YWJ9dmFyIFwiXG4gICAgICAgICAgICAgICAgaWYgZGVjbGFyc1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgc2NvcGUuZGVjbGFyZWRWYXJpYWJsZXMoKS5qb2luKCcsICcpXG4gICAgICAgICAgICAgICAgaWYgYXNzaWduc1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIsXFxuI3tAdGFiICsgVEFCfVwiIGlmIGRlY2xhcnNcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIHNjb3BlLmFzc2lnbmVkVmFyaWFibGVzKCkuam9pbihcIixcXG4je0B0YWIgKyBUQUJ9XCIpXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIFwiO1xcbiN7aWYgQHNwYWNlZCB0aGVuICdcXG4nIGVsc2UgJyd9XCJcbiAgICAgICAgICAgIGVsc2UgaWYgZnJhZ21lbnRzLmxlbmd0aCBhbmQgcG9zdC5sZW5ndGhcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCJcXG5cIlxuICAgICAgICBmcmFnbWVudHMuY29uY2F0IHBvc3RcblxuICAgICMgV3JhcCB1cCB0aGUgZ2l2ZW4gbm9kZXMgYXMgYSAqKkJsb2NrKiosIHVubGVzcyBpdCBhbHJlYWR5IGhhcHBlbnMgdG8gYmUgb25lLlxuICAgIFxuICAgIEB3cmFwOiAobm9kZXMpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbm9kZXNbMF0gaWYgbm9kZXMubGVuZ3RoIGlzIDEgYW5kIG5vZGVzWzBdIGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgbmV3IEJsb2NrIG5vZGVzXG5cbiMgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgXG4jIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICBcbiMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuXG4jIGBMaXRlcmFsYCBpcyBhIGJhc2UgY2xhc3MgZm9yIHN0YXRpYyB2YWx1ZXMgdGhhdCBjYW4gYmUgcGFzc2VkIHRocm91Z2ggZGlyZWN0bHkgaW50byBKYXZhU2NyaXB0IHdpdGhvdXQgdHJhbnNsYXRpb24sIFxuIyBzdWNoIGFzOiBzdHJpbmdzLCBudW1iZXJzLCBgdHJ1ZWAsIGBmYWxzZWAsIGBudWxsYC4uLlxuXG5leHBvcnRzLkxpdGVyYWwgPSBjbGFzcyBMaXRlcmFsIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAdmFsdWUpIC0+XG5cbiAgICBpc0NvbXBsZXg6IE5PXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgbmFtZSBpcyBAdmFsdWVcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgW0BtYWtlQ29kZSBAdmFsdWVdXG5cbiAgICB0b1N0cmluZzogLT5cbiAgICAgICAgXCIgI3tpZiBAaXNTdGF0ZW1lbnQoKSB0aGVuIHN1cGVyIGVsc2UgQGNvbnN0cnVjdG9yLm5hbWV9OiAje0B2YWx1ZX1cIlxuXG5leHBvcnRzLk51bWJlckxpdGVyYWwgPSBjbGFzcyBOdW1iZXJMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG5leHBvcnRzLkluZmluaXR5TGl0ZXJhbCA9IGNsYXNzIEluZmluaXR5TGl0ZXJhbCBleHRlbmRzIE51bWJlckxpdGVyYWxcbiAgICBjb21waWxlTm9kZTogLT5cbiAgICAgICAgW0BtYWtlQ29kZSAnMmUzMDgnXVxuXG5leHBvcnRzLk5hTkxpdGVyYWwgPSBjbGFzcyBOYU5MaXRlcmFsIGV4dGVuZHMgTnVtYmVyTGl0ZXJhbFxuICAgIEA6IC0+XG4gICAgICAgIHN1cGVyICdOYU4nXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGNvZGUgPSBbQG1ha2VDb2RlICcwLzAnXVxuICAgICAgICBpZiBvLmxldmVsID49IExFVkVMX09QIHRoZW4gQHdyYXBJbkJyYWNlcyBjb2RlIGVsc2UgY29kZVxuXG5leHBvcnRzLlN0cmluZ0xpdGVyYWwgPSBjbGFzcyBTdHJpbmdMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG5leHBvcnRzLlJlZ2V4TGl0ZXJhbCA9IGNsYXNzIFJlZ2V4TGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcblxuZXhwb3J0cy5QYXNzdGhyb3VnaExpdGVyYWwgPSBjbGFzcyBQYXNzdGhyb3VnaExpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG5cbmV4cG9ydHMuSWRlbnRpZmllckxpdGVyYWwgPSBjbGFzcyBJZGVudGlmaWVyTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcbiAgICBpc0Fzc2lnbmFibGU6IFlFU1xuXG5leHBvcnRzLlByb3BlcnR5TmFtZSA9IGNsYXNzIFByb3BlcnR5TmFtZSBleHRlbmRzIExpdGVyYWxcbiAgICBpc0Fzc2lnbmFibGU6IFlFU1xuXG5leHBvcnRzLlN0YXRlbWVudExpdGVyYWwgPSBjbGFzcyBTdGF0ZW1lbnRMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuICAgIGlzU3RhdGVtZW50OiBZRVNcblxuICAgIG1ha2VSZXR1cm46IFRISVNcblxuICAgIGp1bXBzOiAobykgLT5cbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQHZhbHVlIGlzICdicmVhaycgYW5kIG5vdCAobz8ubG9vcCBvciBvPy5ibG9jaylcbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQHZhbHVlIGlzICdjb250aW51ZScgYW5kIG5vdCBvPy5sb29wXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFtAbWFrZUNvZGUgXCIje0B0YWJ9I3tAdmFsdWV9O1wiXVxuXG5leHBvcnRzLlRoaXNMaXRlcmFsID0gY2xhc3MgVGhpc0xpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIgJ3RoaXMnXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGNvZGUgPSBpZiBvLnNjb3BlLm1ldGhvZD8uYm91bmQgdGhlbiBvLnNjb3BlLm1ldGhvZC5jb250ZXh0IGVsc2UgQHZhbHVlXG4gICAgICAgIFtAbWFrZUNvZGUgY29kZV1cblxuZXhwb3J0cy5VbmRlZmluZWRMaXRlcmFsID0gY2xhc3MgVW5kZWZpbmVkTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcbiAgICBAOiAtPlxuICAgICAgICBzdXBlciAndW5kZWZpbmVkJ1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBbQG1ha2VDb2RlIGlmIG8ubGV2ZWwgPj0gTEVWRUxfQUNDRVNTIHRoZW4gJyh2b2lkIDApJyBlbHNlICd2b2lkIDAnXVxuXG5leHBvcnRzLk51bGxMaXRlcmFsID0gY2xhc3MgTnVsbExpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIgJ251bGwnXG5cbmV4cG9ydHMuQm9vbGVhbkxpdGVyYWwgPSBjbGFzcyBCb29sZWFuTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuXG4jIEEgYHJldHVybmAgaXMgYSAqcHVyZVN0YXRlbWVudCogLS0gd3JhcHBpbmcgaXQgaW4gYSBjbG9zdXJlIHdvdWxkbid0IG1ha2Ugc2Vuc2UuXG5cbmV4cG9ydHMuUmV0dXJuID0gY2xhc3MgUmV0dXJuIGV4dGVuZHMgQmFzZVxuICAgIEA6IChAZXhwcmVzc2lvbikgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2V4cHJlc3Npb24nXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIG1ha2VSZXR1cm46ICBUSElTXG4gICAganVtcHM6ICAgICAgIFRISVNcblxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8sIGxldmVsKSAtPlxuICAgICAgICBleHByID0gQGV4cHJlc3Npb24/Lm1ha2VSZXR1cm4oKVxuICAgICAgICBpZiBleHByIGFuZCBleHByIG5vdCBpbnN0YW5jZW9mIFJldHVybiB0aGVuIGV4cHIuY29tcGlsZVRvRnJhZ21lbnRzIG8sIGxldmVsIGVsc2Ugc3VwZXIgbywgbGV2ZWxcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgYW5zd2VyID0gW11cbiAgICAgICAgIyBUT0RPOiBJZiB3ZSBjYWxsIGV4cHJlc3Npb24uY29tcGlsZSgpIGhlcmUgdHdpY2UsIHdlJ2xsIHNvbWV0aW1lcyBnZXQgYmFjayBkaWZmZXJlbnQgcmVzdWx0cyFcbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIEB0YWIgKyBcInJldHVybiN7aWYgQGV4cHJlc3Npb24gdGhlbiBcIiBcIiBlbHNlIFwiXCJ9XCJcbiAgICAgICAgaWYgQGV4cHJlc3Npb25cbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgQGV4cHJlc3Npb24uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIjtcIlxuICAgICAgICByZXR1cm4gYW5zd2VyXG5cbiMgYHlpZWxkIHJldHVybmAgd29ya3MgZXhhY3RseSBsaWtlIGByZXR1cm5gLCBleGNlcHQgdGhhdCBpdCB0dXJucyB0aGUgZnVuY3Rpb24gaW50byBhIGdlbmVyYXRvci5cblxuZXhwb3J0cy5ZaWVsZFJldHVybiA9IGNsYXNzIFlpZWxkUmV0dXJuIGV4dGVuZHMgUmV0dXJuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICB1bmxlc3Mgby5zY29wZS5wYXJlbnQ/XG4gICAgICAgICAgICBAZXJyb3IgJ3lpZWxkIGNhbiBvbmx5IG9jY3VyIGluc2lkZSBmdW5jdGlvbnMnXG4gICAgICAgIHN1cGVyXG5cbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jICAwMDAgMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAgICAgMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbiMgQSB2YWx1ZSwgdmFyaWFibGUgb3IgbGl0ZXJhbCBvciBwYXJlbnRoZXNpemVkLCBpbmRleGVkIG9yIGRvdHRlZCBpbnRvLCBvciB2YW5pbGxhLlxuXG5leHBvcnRzLlZhbHVlID0gY2xhc3MgVmFsdWUgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKGJhc2UsIHByb3BzLCB0YWcpIC0+XG4gICAgICAgIHJldHVybiBiYXNlIGlmIG5vdCBwcm9wcyBhbmQgYmFzZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgIEBiYXNlICAgICAgID0gYmFzZVxuICAgICAgICBAcHJvcGVydGllcyA9IHByb3BzIG9yIFtdXG4gICAgICAgIEBbdGFnXSAgICAgID0gdHJ1ZSBpZiB0YWdcbiAgICAgICAgcmV0dXJuIHRoaXNcblxuICAgIGNoaWxkcmVuOiBbJ2Jhc2UnLCAncHJvcGVydGllcyddXG5cbiAgICAjIEFkZCBhIHByb3BlcnR5IChvciAqcHJvcGVydGllcyogKSBgQWNjZXNzYCB0byB0aGUgbGlzdC5cbiAgICBhZGQ6IChwcm9wcykgLT5cbiAgICAgICAgQHByb3BlcnRpZXMgPSBAcHJvcGVydGllcy5jb25jYXQgcHJvcHNcbiAgICAgICAgdGhpc1xuXG4gICAgaGFzUHJvcGVydGllczogLT5cbiAgICAgICAgISFAcHJvcGVydGllcy5sZW5ndGhcblxuICAgIGJhcmVMaXRlcmFsOiAodHlwZSkgLT5cbiAgICAgICAgbm90IEBwcm9wZXJ0aWVzLmxlbmd0aCBhbmQgQGJhc2UgaW5zdGFuY2VvZiB0eXBlXG5cbiAgICAjIFNvbWUgYm9vbGVhbiBjaGVja3MgZm9yIHRoZSBiZW5lZml0IG9mIG90aGVyIG5vZGVzLlxuICAgIGlzQXJyYXk6ICAgICAgLT4gQGJhcmVMaXRlcmFsKEFycilcbiAgICBpc1JhbmdlOiAgICAgIC0+IEBiYXJlTGl0ZXJhbChSYW5nZSlcbiAgICBpc0NvbXBsZXg6ICAgIC0+IEBoYXNQcm9wZXJ0aWVzKCkgb3IgQGJhc2UuaXNDb21wbGV4KClcbiAgICBpc0Fzc2lnbmFibGU6IC0+IEBoYXNQcm9wZXJ0aWVzKCkgb3IgQGJhc2UuaXNBc3NpZ25hYmxlKClcbiAgICBpc051bWJlcjogICAgIC0+IEBiYXJlTGl0ZXJhbChOdW1iZXJMaXRlcmFsKVxuICAgIGlzU3RyaW5nOiAgICAgLT4gQGJhcmVMaXRlcmFsKFN0cmluZ0xpdGVyYWwpXG4gICAgaXNSZWdleDogICAgICAtPiBAYmFyZUxpdGVyYWwoUmVnZXhMaXRlcmFsKVxuICAgIGlzVW5kZWZpbmVkOiAgLT4gQGJhcmVMaXRlcmFsKFVuZGVmaW5lZExpdGVyYWwpXG4gICAgaXNOdWxsOiAgICAgICAtPiBAYmFyZUxpdGVyYWwoTnVsbExpdGVyYWwpXG4gICAgaXNCb29sZWFuOiAgICAtPiBAYmFyZUxpdGVyYWwoQm9vbGVhbkxpdGVyYWwpXG4gICAgaXNBdG9taWM6ICAgICAtPlxuICAgICAgICBmb3Igbm9kZSBpbiBAcHJvcGVydGllcy5jb25jYXQgQGJhc2VcbiAgICAgICAgICAgIHJldHVybiBubyBpZiBub2RlLnNvYWsgb3Igbm9kZSBpbnN0YW5jZW9mIENhbGxcbiAgICAgICAgeWVzXG5cbiAgICBpc05vdENhbGxhYmxlOiAtPiBAaXNOdW1iZXIoKSBvciBAaXNTdHJpbmcoKSBvciBAaXNSZWdleCgpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGlzQXJyYXkoKSBvciBAaXNSYW5nZSgpIG9yIEBpc1NwbGljZSgpIG9yIEBpc09iamVjdCgpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGlzVW5kZWZpbmVkKCkgb3IgQGlzTnVsbCgpIG9yIEBpc0Jvb2xlYW4oKVxuXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAgICAtPiBub3QgQHByb3BlcnRpZXMubGVuZ3RoIGFuZCBAYmFzZS5pc1N0YXRlbWVudCBvXG4gICAgYXNzaWduczogICAgIChuYW1lKSAtPiBub3QgQHByb3BlcnRpZXMubGVuZ3RoIGFuZCBAYmFzZS5hc3NpZ25zIG5hbWVcbiAgICBqdW1wczogICAgICAgKG8pICAgIC0+IG5vdCBAcHJvcGVydGllcy5sZW5ndGggYW5kIEBiYXNlLmp1bXBzIG9cblxuICAgIGlzT2JqZWN0OiAob25seUdlbmVyYXRlZCkgLT5cbiAgICAgICAgcmV0dXJuIG5vIGlmIEBwcm9wZXJ0aWVzLmxlbmd0aFxuICAgICAgICAoQGJhc2UgaW5zdGFuY2VvZiBPYmopIGFuZCAobm90IG9ubHlHZW5lcmF0ZWQgb3IgQGJhc2UuZ2VuZXJhdGVkKVxuXG4gICAgaXNTcGxpY2U6IC0+XG4gICAgICAgIFsuLi4sIGxhc3RQcm9wXSA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGxhc3RQcm9wIGluc3RhbmNlb2YgU2xpY2VcblxuICAgIGxvb2tzU3RhdGljOiAoY2xhc3NOYW1lKSAtPlxuICAgICAgICBAYmFzZS52YWx1ZSBpcyBjbGFzc05hbWUgYW5kIEBwcm9wZXJ0aWVzLmxlbmd0aCBpcyAxIGFuZFxuICAgICAgICAgICAgQHByb3BlcnRpZXNbMF0ubmFtZT8udmFsdWUgIT0gJ3Byb3RvdHlwZSdcblxuICAgICMgVGhlIHZhbHVlIGNhbiBiZSB1bndyYXBwZWQgYXMgaXRzIGlubmVyIG5vZGUsIGlmIHRoZXJlIGFyZSBubyBhdHRhY2hlZCBwcm9wZXJ0aWVzLlxuICAgIHVud3JhcDogLT5cbiAgICAgICAgaWYgQHByb3BlcnRpZXMubGVuZ3RoIHRoZW4gdGhpcyBlbHNlIEBiYXNlXG5cbiAgICAjIEEgcmVmZXJlbmNlIGhhcyBiYXNlIHBhcnQgKGB0aGlzYCB2YWx1ZSkgYW5kIG5hbWUgcGFydC5cbiAgICAjIFdlIGNhY2hlIHRoZW0gc2VwYXJhdGVseSBmb3IgY29tcGlsaW5nIGNvbXBsZXggZXhwcmVzc2lvbnMuXG4gICAgIyBgYSgpW2IoKV0gPz0gY2AgLT4gYChfYmFzZSA9IGEoKSlbX25hbWUgPSBiKCldID8gX2Jhc2VbX25hbWVdID0gY2BcbiAgICBcbiAgICBjYWNoZVJlZmVyZW5jZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBbLi4uLCBuYW1lXSA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIEBwcm9wZXJ0aWVzLmxlbmd0aCA8IDIgYW5kIG5vdCBAYmFzZS5pc0NvbXBsZXgoKSBhbmQgbm90IG5hbWU/LmlzQ29tcGxleCgpXG4gICAgICAgICAgICByZXR1cm4gW3RoaXMsIHRoaXNdICAjIGBhYCBgYS5iYFxuICAgICAgICBiYXNlID0gbmV3IFZhbHVlIEBiYXNlLCBAcHJvcGVydGllc1suLi4tMV1cbiAgICAgICAgaWYgYmFzZS5pc0NvbXBsZXgoKSAgIyBgYSgpLmJgXG4gICAgICAgICAgICBicmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdiYXNlJ1xuICAgICAgICAgICAgYmFzZSA9IG5ldyBWYWx1ZSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gYnJlZiwgYmFzZVxuICAgICAgICByZXR1cm4gW2Jhc2UsIGJyZWZdIHVubGVzcyBuYW1lICAjIGBhKClgXG4gICAgICAgIGlmIG5hbWUuaXNDb21wbGV4KCkgICMgYGFbYigpXWBcbiAgICAgICAgICAgIG5yZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ25hbWUnXG4gICAgICAgICAgICBuYW1lID0gbmV3IEluZGV4IG5ldyBBc3NpZ24gbnJlZiwgbmFtZS5pbmRleFxuICAgICAgICAgICAgbnJlZiA9IG5ldyBJbmRleCBucmVmXG4gICAgICAgIFtiYXNlLmFkZChuYW1lKSwgbmV3IFZhbHVlKGJyZWYgb3IgYmFzZS5iYXNlLCBbbnJlZiBvciBuYW1lXSldXG5cbiAgICAjIFdlIGNvbXBpbGUgYSB2YWx1ZSB0byBKYXZhU2NyaXB0IGJ5IGNvbXBpbGluZyBhbmQgam9pbmluZyBlYWNoIHByb3BlcnR5LlxuICAgICMgVGhpbmdzIGdldCBtdWNoIG1vcmUgaW50ZXJlc3RpbmcgaWYgdGhlIGNoYWluIG9mIHByb3BlcnRpZXMgaGFzICpzb2FrKlxuICAgICMgb3BlcmF0b3JzIGA/LmAgaW50ZXJzcGVyc2VkLiBUaGVuIHdlIGhhdmUgdG8gdGFrZSBjYXJlIG5vdCB0byBhY2NpZGVudGFsbHlcbiAgICAjIGV2YWx1YXRlIGFueXRoaW5nIHR3aWNlIHdoZW4gYnVpbGRpbmcgdGhlIHNvYWsgY2hhaW4uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgQGJhc2UuZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgcHJvcHMgPSBAcHJvcGVydGllc1xuICAgICAgICBmcmFnbWVudHMgPSBAYmFzZS5jb21waWxlVG9GcmFnbWVudHMgbywgKGlmIHByb3BzLmxlbmd0aCB0aGVuIExFVkVMX0FDQ0VTUyBlbHNlIG51bGwpXG4gICAgICAgIGlmIHByb3BzLmxlbmd0aCBhbmQgU0lNUExFTlVNLnRlc3QgQGZyYWdtZW50c1RvVGV4dCBmcmFnbWVudHNcbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSAnLidcbiAgICAgICAgZm9yIHByb3AgaW4gcHJvcHNcbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIChwcm9wLmNvbXBpbGVUb0ZyYWdtZW50cyBvKS4uLlxuICAgICAgICBmcmFnbWVudHNcblxuICAgICMgVW5mb2xkIGEgc29hayBpbnRvIGFuIGBJZmA6IGBhPy5iYCAtPiBgYS5iIGlmIGE/YFxuICAgIFxuICAgIHVuZm9sZFNvYWs6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgQHVuZm9sZGVkU29hayA/PSBkbyA9PlxuICAgICAgICAgICAgaWYgaWZuID0gQGJhc2UudW5mb2xkU29hayBvXG4gICAgICAgICAgICAgICAgaWZuLmJvZHkucHJvcGVydGllcy5wdXNoIEBwcm9wZXJ0aWVzLi4uXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmblxuICAgICAgICAgICAgZm9yIHByb3AsIGkgaW4gQHByb3BlcnRpZXMgd2hlbiBwcm9wLnNvYWtcbiAgICAgICAgICAgICAgICBwcm9wLnNvYWsgPSBvZmZcbiAgICAgICAgICAgICAgICBmc3QgPSBuZXcgVmFsdWUgQGJhc2UsIEBwcm9wZXJ0aWVzWy4uLmldXG4gICAgICAgICAgICAgICAgc25kID0gbmV3IFZhbHVlIEBiYXNlLCBAcHJvcGVydGllc1tpLi5dXG4gICAgICAgICAgICAgICAgaWYgZnN0LmlzQ29tcGxleCgpXG4gICAgICAgICAgICAgICAgICAgIHJlZiA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ1xuICAgICAgICAgICAgICAgICAgICBmc3QgPSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gcmVmLCBmc3RcbiAgICAgICAgICAgICAgICAgICAgc25kLmJhc2UgPSByZWZcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IElmIG5ldyBFeGlzdGVuY2UoZnN0KSwgc25kLCBzb2FrOiBvblxuICAgICAgICAgICAgbm9cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuQ29tbWVudCA9IGNsYXNzIENvbW1lbnQgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBjb21tZW50KSAtPlxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIG1ha2VSZXR1cm46ICBUSElTXG5cbiAgICBjb21waWxlTm9kZTogKG8sIGxldmVsKSAtPlxuICAgICAgICBcbiAgICAgICAgY29tbWVudCA9IEBjb21tZW50LnJlcGxhY2UgL14oXFxzKikjKD89XFxzKS9nbSwgXCIkMSAqXCJcbiAgICAgICAgY29kZSA9IFwiLyoje211bHRpZGVudCBjb21tZW50LCBAdGFifSN7aWYgJ1xcbicgaW4gY29tbWVudCB0aGVuIFwiXFxuI3tAdGFifVwiIGVsc2UgJyd9ICovXCJcbiAgICAgICAgY29kZSA9IG8uaW5kZW50ICsgY29kZSBpZiAobGV2ZWwgb3Igby5sZXZlbCkgaXMgTEVWRUxfVE9QXG4gICAgICAgIFtAbWFrZUNvZGUoXCJcXG5cIiksIEBtYWtlQ29kZShjb2RlKV1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4jIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMCAgXG5cbiMgTm9kZSBmb3IgYSBmdW5jdGlvbiBpbnZvY2F0aW9uLlxuICAgIFxuZXhwb3J0cy5DYWxsID0gY2xhc3MgQ2FsbCBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQHZhcmlhYmxlLCBAYXJncyA9IFtdLCBAc29haykgLT5cbiAgICAgICAgXG4gICAgICAgIEBpc05ldyA9IGZhbHNlXG4gICAgICAgIGlmIEB2YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBAdmFyaWFibGUuaXNOb3RDYWxsYWJsZSgpXG4gICAgICAgICAgICAjIGxvZyBAdmFyaWFibGVcbiAgICAgICAgICAgIEB2YXJpYWJsZS5lcnJvciBcImxpdGVyYWwgaXMgbm90IGEgZnVuY3Rpb25cIlxuXG4gICAgY2hpbGRyZW46IFsndmFyaWFibGUnLCAnYXJncyddXG5cbiAgICAjIFdoZW4gc2V0dGluZyB0aGUgbG9jYXRpb24sIHdlIHNvbWV0aW1lcyBuZWVkIHRvIHVwZGF0ZSB0aGUgc3RhcnQgbG9jYXRpb24gdG9cbiAgICAjIGFjY291bnQgZm9yIGEgbmV3bHktZGlzY292ZXJlZCBgbmV3YCBvcGVyYXRvciB0byB0aGUgbGVmdCBvZiB1cy4gVGhpc1xuICAgICMgZXhwYW5kcyB0aGUgcmFuZ2Ugb24gdGhlIGxlZnQsIGJ1dCBub3QgdGhlIHJpZ2h0LlxuICAgIFxuICAgIHVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZzogKGxvY2F0aW9uRGF0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsb2NhdGlvbkRhdGEgYW5kIEBuZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uXG4gICAgICAgICAgICBAbG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgPSBsb2NhdGlvbkRhdGEuZmlyc3RfbGluZVxuICAgICAgICAgICAgQGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW4gPSBsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXG4gICAgICAgICAgICBiYXNlID0gQHZhcmlhYmxlPy5iYXNlIG9yIEB2YXJpYWJsZVxuICAgICAgICAgICAgaWYgYmFzZS5uZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uXG4gICAgICAgICAgICAgICAgQHZhcmlhYmxlLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lID0gbG9jYXRpb25EYXRhLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICBAdmFyaWFibGUubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbiA9IGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBiYXNlLnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBsb2NhdGlvbkRhdGFcbiAgICAgICAgICAgIGRlbGV0ZSBAbmVlZHNVcGRhdGVkU3RhcnRMb2NhdGlvblxuICAgICAgICBzdXBlclxuXG4gICAgIyBUYWcgdGhpcyBpbnZvY2F0aW9uIGFzIGNyZWF0aW5nIGEgbmV3IGluc3RhbmNlLlxuICAgIG5ld0luc3RhbmNlOiAtPlxuICAgICAgICBiYXNlID0gQHZhcmlhYmxlPy5iYXNlIG9yIEB2YXJpYWJsZVxuICAgICAgICBpZiBiYXNlIGluc3RhbmNlb2YgQ2FsbCBhbmQgbm90IGJhc2UuaXNOZXdcbiAgICAgICAgICAgIGJhc2UubmV3SW5zdGFuY2UoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXNOZXcgPSB0cnVlXG4gICAgICAgIEBuZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uID0gdHJ1ZVxuICAgICAgICB0aGlzXG5cbiAgICAjIFNvYWtlZCBjaGFpbmVkIGludm9jYXRpb25zIHVuZm9sZCBpbnRvIGlmL2Vsc2UgdGVybmFyeSBzdHJ1Y3R1cmVzLlxuICAgIHVuZm9sZFNvYWs6IChvKSAtPlxuICAgICAgICBpZiBAc29ha1xuICAgICAgICAgICAgaWYgdGhpcyBpbnN0YW5jZW9mIFN1cGVyQ2FsbFxuICAgICAgICAgICAgICAgIGxlZnQgPSBuZXcgTGl0ZXJhbCBAc3VwZXJSZWZlcmVuY2Ugb1xuICAgICAgICAgICAgICAgIHJpdGUgPSBuZXcgVmFsdWUgbGVmdFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBpZm4gaWYgaWZuID0gdW5mb2xkU29hayBvLCB0aGlzLCAndmFyaWFibGUnXG4gICAgICAgICAgICAgICAgW2xlZnQsIHJpdGVdID0gbmV3IFZhbHVlKEB2YXJpYWJsZSkuY2FjaGVSZWZlcmVuY2Ugb1xuICAgICAgICAgICAgcml0ZSA9IG5ldyBDYWxsIHJpdGUsIEBhcmdzXG4gICAgICAgICAgICByaXRlLmlzTmV3ID0gQGlzTmV3XG4gICAgICAgICAgICBsZWZ0ID0gbmV3IExpdGVyYWwgXCJ0eXBlb2YgI3sgbGVmdC5jb21waWxlIG8gfSA9PT0gXFxcImZ1bmN0aW9uXFxcIlwiXG4gICAgICAgICAgICByZXR1cm4gbmV3IElmIGxlZnQsIG5ldyBWYWx1ZShyaXRlKSwgc29hazogeWVzXG4gICAgICAgIGNhbGwgPSB0aGlzXG4gICAgICAgIGxpc3QgPSBbXVxuICAgICAgICBsb29wXG4gICAgICAgICAgICBpZiBjYWxsLnZhcmlhYmxlIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICAgICAgICAgIGxpc3QucHVzaCBjYWxsXG4gICAgICAgICAgICAgICAgY2FsbCA9IGNhbGwudmFyaWFibGVcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGNhbGwudmFyaWFibGUgaW5zdGFuY2VvZiBWYWx1ZVxuICAgICAgICAgICAgbGlzdC5wdXNoIGNhbGxcbiAgICAgICAgICAgIGJyZWFrIHVubGVzcyAoY2FsbCA9IGNhbGwudmFyaWFibGUuYmFzZSkgaW5zdGFuY2VvZiBDYWxsXG4gICAgICAgIGZvciBjYWxsIGluIGxpc3QucmV2ZXJzZSgpXG4gICAgICAgICAgICBpZiBpZm5cbiAgICAgICAgICAgICAgICBpZiBjYWxsLnZhcmlhYmxlIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICAgICAgICAgICAgICBjYWxsLnZhcmlhYmxlID0gaWZuXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjYWxsLnZhcmlhYmxlLmJhc2UgPSBpZm5cbiAgICAgICAgICAgIGlmbiA9IHVuZm9sZFNvYWsgbywgY2FsbCwgJ3ZhcmlhYmxlJ1xuICAgICAgICBpZm5cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT4gIyBDb21waWxlIGEgdmFuaWxsYSBmdW5jdGlvbiBjYWxsLlxuICAgICAgICBcbiAgICAgICAgQHZhcmlhYmxlPy5mcm9udCA9IEBmcm9udFxuICAgICAgICBjb21waWxlZEFycmF5ID0gU3BsYXQuY29tcGlsZVNwbGF0dGVkQXJyYXkgbywgQGFyZ3MsIHRydWVcbiAgICAgICAgaWYgY29tcGlsZWRBcnJheS5sZW5ndGhcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVNwbGF0IG8sIGNvbXBpbGVkQXJyYXlcbiAgICAgICAgY29tcGlsZWRBcmdzID0gW11cbiAgICAgICAgZm9yIGFyZywgYXJnSW5kZXggaW4gQGFyZ3NcbiAgICAgICAgICAgIGlmIGFyZ0luZGV4IHRoZW4gY29tcGlsZWRBcmdzLnB1c2ggQG1ha2VDb2RlIFwiLCBcIlxuICAgICAgICAgICAgY29tcGlsZWRBcmdzLnB1c2ggKGFyZy5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCkuLi5cblxuICAgICAgICBmcmFnbWVudHMgPSBbXVxuICAgICAgICBpZiB0aGlzIGluc3RhbmNlb2YgU3VwZXJDYWxsXG4gICAgICAgICAgICBwcmVmYWNlID0gQHN1cGVyUmVmZXJlbmNlKG8pICsgXCIuY2FsbCgje0BzdXBlclRoaXMobyl9XCJcbiAgICAgICAgICAgIGlmIGNvbXBpbGVkQXJncy5sZW5ndGggdGhlbiBwcmVmYWNlICs9IFwiLCBcIlxuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIHByZWZhY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGlzTmV3IHRoZW4gZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICduZXcgJ1xuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9BQ0NFU1MpLi4uXG4gICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIoXCJcbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggY29tcGlsZWRBcmdzLi4uXG4gICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIilcIlxuICAgICAgICBmcmFnbWVudHNcblxuICAgICMgSWYgeW91IGNhbGwgYSBmdW5jdGlvbiB3aXRoIGEgc3BsYXQsIGl0J3MgY29udmVydGVkIGludG8gYSBKYXZhU2NyaXB0XG4gICAgIyBgLmFwcGx5KClgIGNhbGwgdG8gYWxsb3cgYW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZC5cbiAgICAjIElmIGl0J3MgYSBjb25zdHJ1Y3RvciwgdGhlbiB0aGluZ3MgZ2V0IHJlYWwgdHJpY2t5LiBXZSBoYXZlIHRvIGluamVjdCBhblxuICAgICMgaW5uZXIgY29uc3RydWN0b3IgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBwYXNzIHRoZSB2YXJhcmdzLlxuICAgICNcbiAgICAjIHNwbGF0QXJncyBpcyBhbiBhcnJheSBvZiBDb2RlRnJhZ21lbnRzIHRvIHB1dCBpbnRvIHRoZSAnYXBwbHknLlxuICAgIFxuICAgIGNvbXBpbGVTcGxhdDogKG8sIHNwbGF0QXJncykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHRoaXMgaW5zdGFuY2VvZiBTdXBlckNhbGxcbiAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgQG1ha2VDb2RlKFwiI3sgQHN1cGVyUmVmZXJlbmNlIG8gfS5hcHBseSgje0BzdXBlclRoaXMobyl9LCBcIiksXG4gICAgICAgICAgICAgICAgc3BsYXRBcmdzLCBAbWFrZUNvZGUoXCIpXCIpXG5cbiAgICAgICAgaWYgQGlzTmV3XG4gICAgICAgICAgICBpZHQgPSBAdGFiICsgVEFCXG4gICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IEBtYWtlQ29kZShcIlwiXCJcbiAgICAgICAgICAgICAgICAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgICAgICAgICAgICN7aWR0fWN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgI3tpZHR9dmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICN7aWR0fXJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgICAgICAgICAgICAgI3tAdGFifX0pKFwiXCJcIiksXG4gICAgICAgICAgICAgICAgKEB2YXJpYWJsZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCksXG4gICAgICAgICAgICAgICAgQG1ha2VDb2RlKFwiLCBcIiksIHNwbGF0QXJncywgQG1ha2VDb2RlKFwiLCBmdW5jdGlvbigpe30pXCIpXG5cbiAgICAgICAgYW5zd2VyID0gW11cbiAgICAgICAgYmFzZSA9IG5ldyBWYWx1ZSBAdmFyaWFibGVcbiAgICAgICAgaWYgKG5hbWUgPSBiYXNlLnByb3BlcnRpZXMucG9wKCkpIGFuZCBiYXNlLmlzQ29tcGxleCgpXG4gICAgICAgICAgICByZWYgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ1xuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAbWFrZUNvZGUoXCIoI3tyZWZ9ID0gXCIpLFxuICAgICAgICAgICAgICAgIChiYXNlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUKSxcbiAgICAgICAgICAgICAgICBAbWFrZUNvZGUoXCIpXCIpLFxuICAgICAgICAgICAgICAgIG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzKG8pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZ1biA9IGJhc2UuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0FDQ0VTU1xuICAgICAgICAgICAgZnVuID0gQHdyYXBJbkJyYWNlcyBmdW4gaWYgU0lNUExFTlVNLnRlc3QgQGZyYWdtZW50c1RvVGV4dCBmdW5cbiAgICAgICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgICAgICByZWYgPSBAZnJhZ21lbnRzVG9UZXh0IGZ1blxuICAgICAgICAgICAgICAgIGZ1bi5wdXNoIChuYW1lLmNvbXBpbGVUb0ZyYWdtZW50cyBvKS4uLlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJlZiA9ICdudWxsJ1xuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBmdW5cbiAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAbWFrZUNvZGUoXCIuYXBwbHkoI3tyZWZ9LCBcIiksIHNwbGF0QXJncywgQG1ha2VDb2RlKFwiKVwiKVxuXG4jICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgVGFrZXMgY2FyZSBvZiBjb252ZXJ0aW5nIGBzdXBlcigpYCBjYWxscyBpbnRvIGNhbGxzIGFnYWluc3QgdGhlIHByb3RvdHlwZSdzIGZ1bmN0aW9uIG9mIHRoZSBzYW1lIG5hbWUuXG5cbmV4cG9ydHMuU3VwZXJDYWxsID0gY2xhc3MgU3VwZXJDYWxsIGV4dGVuZHMgQ2FsbFxuICAgIFxuICAgIEA6IChhcmdzKSAtPlxuICAgICAgICBzdXBlciBudWxsLCBhcmdzID8gW25ldyBTcGxhdCBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ2FyZ3VtZW50cyddXG4gICAgICAgICMgQWxsb3cgdG8gcmVjb2duaXplIGEgYmFyZSBgc3VwZXJgIGNhbGwgd2l0aG91dCBwYXJlbnRoZXNlcyBhbmQgYXJndW1lbnRzLlxuICAgICAgICBAaXNCYXJlID0gYXJncz9cblxuICAgICMgR3JhYiB0aGUgcmVmZXJlbmNlIHRvIHRoZSBzdXBlcmNsYXNzJ3MgaW1wbGVtZW50YXRpb24gb2YgdGhlIGN1cnJlbnQgbWV0aG9kLlxuICAgIFxuICAgIHN1cGVyUmVmZXJlbmNlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIG1ldGhvZCA9IG8uc2NvcGUubmFtZWRNZXRob2QoKVxuICAgICAgICBpZiBtZXRob2Q/LmtsYXNzXG4gICAgICAgICAgICB7a2xhc3MsIG5hbWUsIHZhcmlhYmxlfSA9IG1ldGhvZFxuICAgICAgICAgICAgaWYga2xhc3MuaXNDb21wbGV4KClcbiAgICAgICAgICAgICAgICBicmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUucGFyZW50LmZyZWVWYXJpYWJsZSAnYmFzZSdcbiAgICAgICAgICAgICAgICBiYXNlID0gbmV3IFZhbHVlIG5ldyBQYXJlbnMgbmV3IEFzc2lnbiBicmVmLCBrbGFzc1xuICAgICAgICAgICAgICAgIHZhcmlhYmxlLmJhc2UgPSBiYXNlXG4gICAgICAgICAgICAgICAgdmFyaWFibGUucHJvcGVydGllcy5zcGxpY2UgMCwga2xhc3MucHJvcGVydGllcy5sZW5ndGhcbiAgICAgICAgICAgIGlmIG5hbWUuaXNDb21wbGV4KCkgb3IgKG5hbWUgaW5zdGFuY2VvZiBJbmRleCBhbmQgbmFtZS5pbmRleC5pc0Fzc2lnbmFibGUoKSlcbiAgICAgICAgICAgICAgICBucmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUucGFyZW50LmZyZWVWYXJpYWJsZSAnbmFtZSdcbiAgICAgICAgICAgICAgICBuYW1lID0gbmV3IEluZGV4IG5ldyBBc3NpZ24gbnJlZiwgbmFtZS5pbmRleFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlLnByb3BlcnRpZXMucG9wKClcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5wcm9wZXJ0aWVzLnB1c2ggbmFtZVxuICAgICAgICAgICAgYWNjZXNzZXMgPSBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdfX3N1cGVyX18nXVxuICAgICAgICAgICAgYWNjZXNzZXMucHVzaCBuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgJ2NvbnN0cnVjdG9yJyBpZiBtZXRob2Quc3RhdGljXG4gICAgICAgICAgICBhY2Nlc3Nlcy5wdXNoIGlmIG5yZWY/IHRoZW4gbmV3IEluZGV4IG5yZWYgZWxzZSBuYW1lXG4gICAgICAgICAgICAobmV3IFZhbHVlIGJyZWYgPyBrbGFzcywgYWNjZXNzZXMpLmNvbXBpbGUgb1xuICAgICAgICBlbHNlIGlmIG1ldGhvZD8uY3RvclxuICAgICAgICAgICAgIyBsb2cgXCJTdXBlckNhbGwuc3VwZXJSZWZlcmVuY2UgI3ttZXRob2QubmFtZX0gZGFkdW1tIVwiXG4gICAgICAgICAgICBcIiN7bWV0aG9kLm5hbWV9Ll9fc3VwZXJfXy5jb25zdHJ1Y3RvclwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlcnJvciAnY2Fubm90IGNhbGwgc3VwZXIgb3V0c2lkZSBvZiBhbiBpbnN0YW5jZSBtZXRob2QuICcgKyBtZXRob2RcblxuICAgICMgVGhlIGFwcHJvcHJpYXRlIGB0aGlzYCB2YWx1ZSBmb3IgYSBgc3VwZXJgIGNhbGwuXG4gICAgICAgIFxuICAgIHN1cGVyVGhpczogKG8pIC0+XG4gICAgICAgIG1ldGhvZCA9IG8uc2NvcGUubWV0aG9kXG4gICAgICAgIChtZXRob2QgYW5kIG5vdCBtZXRob2Qua2xhc3MgYW5kIG1ldGhvZC5jb250ZXh0KSBvciBcInRoaXNcIlxuXG4gICAgY29tcGlsZVNwbGF0OiAobywgc3BsYXRBcmdzKSAtPlxuICAgICAgICAjIGxvZyAnY29tcGlsZVNwbGF0Jywgby5mZWF0dXJlXG4gICAgICAgIGlmIHNwbGF0QXJncy5sZW5ndGggPT0gMSBhbmQgc3BsYXRBcmdzWzBdLmNvZGUgPT0gJ2FyZ3VtZW50cycgYW5kIEBjb25maWdQYXJhbWV0ZXI/IGFuZCBoYXNGZWF0dXJlIG8sICdjb25maWdfcGFyYW1ldGVycydcbiAgICAgICAgICAgICMgVE9ETzogc2hvdWxkbid0IGFsbCByZWZlcmVuY2VzIHRvIGFyZ3VtZW50cyBiZSBjb252ZXJ0ZWQ/XG4gICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IEBtYWtlQ29kZShcIiN7QGNvbmZpZ1BhcmFtZXRlckNvZGVCZWZvcmVTdXBlcigpfSN7IEBzdXBlclJlZmVyZW5jZSBvIH0uYXBwbHkoI3tAc3VwZXJUaGlzKG8pfSwgXCIpLCBzcGxhdEFyZ3MsIEBtYWtlQ29kZShcIilcIilcbiAgICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICBcbiAgICBjb25maWdQYXJhbWV0ZXJDb2RlQmVmb3JlU3VwZXI6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gJycgaWYgbm90IHBhcmFtID0gQGNvbmZpZ1BhcmFtZXRlclxuXG4gICAgICAgIGEgPSBwYXJhbS5vYmplY3RzLm1hcCAob2JqKSAtPiBcbiAgICAgICAgICAgIG4gPSBvYmoudmFyaWFibGUuYmFzZS52YWx1ZVxuICAgICAgICAgICAgaWYgbiA9PSAndGhpcydcbiAgICAgICAgICAgICAgICBuID0gb2JqLnZhcmlhYmxlLnByb3BlcnRpZXM/WzBdLm5hbWUudmFsdWVcbiAgICAgICAgICAgICAgICBcIiN7bn06dGhpcy4je259XCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ID0gb2JqLnZhbHVlLnZhcmlhYmxlPy50aGlzIGFuZCAndGhpcy4nIG9yICcnXG4gICAgICAgICAgICAgICAgXCIje259OiN7dCtufVwiXG4gICAgICAgICAgICBcbiAgICAgICAgXCJhcmd1bWVudHNbMF0gPSBfLmRlZmF1bHRzKHsje2Euam9pbiAnLCd9fSwgYXJndW1lbnRzWzBdKTsgXCJcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFJlZ2V4ZXMgd2l0aCBpbnRlcnBvbGF0aW9ucyBhcmUgaW4gZmFjdCBqdXN0IGEgdmFyaWF0aW9uIG9mIGEgYENhbGxgIChhXG4jIGBSZWdFeHAoKWAgY2FsbCB0byBiZSBwcmVjaXNlKSB3aXRoIGEgYFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9uc2AgaW5zaWRlLlxuXG5leHBvcnRzLlJlZ2V4V2l0aEludGVycG9sYXRpb25zID0gY2xhc3MgUmVnZXhXaXRoSW50ZXJwb2xhdGlvbnMgZXh0ZW5kcyBDYWxsXG4gICAgXG4gICAgQDogKGFyZ3MgPSBbXSkgLT5cbiAgICAgICAgc3VwZXIgKG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ1JlZ0V4cCcpLCBhcmdzLCBmYWxzZVxuXG4jIFRhZ2dlZFRlbXBsYXRlQ2FsbFxuXG5leHBvcnRzLlRhZ2dlZFRlbXBsYXRlQ2FsbCA9IGNsYXNzIFRhZ2dlZFRlbXBsYXRlQ2FsbCBleHRlbmRzIENhbGxcbiAgICBcbiAgICBAOiAodmFyaWFibGUsIGFyZywgc29haykgLT5cbiAgICAgICAgYXJnID0gbmV3IFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9ucyBCbG9jay53cmFwKFsgbmV3IFZhbHVlIGFyZyBdKSBpZiBhcmcgaW5zdGFuY2VvZiBTdHJpbmdMaXRlcmFsXG4gICAgICAgIHN1cGVyIHZhcmlhYmxlLCBbIGFyZyBdLCBzb2FrXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgICMgVGVsbCBgU3RyaW5nV2l0aEludGVycG9sYXRpb25zYCB3aGV0aGVyIHRvIGNvbXBpbGUgYXMgRVMyMDE1IG9yIG5vdDsgd2lsbCBiZSByZW1vdmVkIGluIEtvZmZlZSAyLlxuICAgICAgICBvLmluVGFnZ2VkVGVtcGxhdGVDYWxsID0geWVzXG4gICAgICAgIEB2YXJpYWJsZS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfQUNDRVNTKS5jb25jYXQgQGFyZ3NbMF0uY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX0xJU1QpXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcblxuIyBOb2RlIHRvIGV4dGVuZCBhbiBvYmplY3QncyBwcm90b3R5cGUgd2l0aCBhbiBhbmNlc3RvciBvYmplY3QuXG4jIEFmdGVyIGBnb29nLmluaGVyaXRzYCBmcm9tIHRoZVxuIyBbQ2xvc3VyZSBMaWJyYXJ5XShodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2Nsb3N1cmUtbGlicmFyeS9ibG9iL21hc3Rlci9jbG9zdXJlL2dvb2cvYmFzZS5qcykuXG5cbmV4cG9ydHMuRXh0ZW5kcyA9IGNsYXNzIEV4dGVuZHMgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBjaGlsZCwgQHBhcmVudCkgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2NoaWxkJywgJ3BhcmVudCddXG5cbiAgICAjIEhvb2tzIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIncyBwcm90b3R5cGUgY2hhaW4uXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobykgLT5cbiAgICAgICAgbmV3IENhbGwobmV3IFZhbHVlKG5ldyBMaXRlcmFsIHV0aWxpdHkgJ2V4dGVuZCcsIG8pLCBbQGNoaWxkLCBAcGFyZW50XSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBBIGAuYCBhY2Nlc3MgaW50byBhIHByb3BlcnR5IG9mIGEgdmFsdWUsIG9yIHRoZSBgOjpgIHNob3J0aGFuZCBmb3JcbiMgYW4gYWNjZXNzIGludG8gdGhlIG9iamVjdCdzIHByb3RvdHlwZS5cblxuZXhwb3J0cy5BY2Nlc3MgPSBjbGFzcyBBY2Nlc3MgZXh0ZW5kcyBCYXNlXG4gICAgQDogKEBuYW1lLCB0YWcpIC0+XG4gICAgICAgIEBzb2FrID0gdGFnIGlzICdzb2FrJ1xuXG4gICAgY2hpbGRyZW46IFsnbmFtZSddXG5cbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvKSAtPlxuICAgICAgICBuYW1lID0gQG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgbm9kZSA9IEBuYW1lLnVud3JhcCgpXG4gICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBQcm9wZXJ0eU5hbWVcbiAgICAgICAgICAgIGlmIG5vZGUudmFsdWUgaW4gSlNfRk9SQklEREVOXG4gICAgICAgICAgICAgICAgW0BtYWtlQ29kZSgnW1wiJyksIG5hbWUuLi4sIEBtYWtlQ29kZSgnXCJdJyldXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgW0BtYWtlQ29kZSgnLicpLCBuYW1lLi4uXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBbQG1ha2VDb2RlKCdbJyksIG5hbWUuLi4sIEBtYWtlQ29kZSgnXScpXVxuXG4gICAgaXNDb21wbGV4OiBOT1xuXG4jIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4jIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBBIGBbIC4uLiBdYCBpbmRleGVkIGFjY2VzcyBpbnRvIGFuIGFycmF5IG9yIG9iamVjdC5cblxuZXhwb3J0cy5JbmRleCA9IGNsYXNzIEluZGV4IGV4dGVuZHMgQmFzZVxuICAgIEA6IChAaW5kZXgpIC0+XG5cbiAgICBjaGlsZHJlbjogWydpbmRleCddXG5cbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvKSAtPlxuICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKFwiW1wiKSwgQGluZGV4LmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9QQVJFTiksIEBtYWtlQ29kZShcIl1cIilcblxuICAgIGlzQ29tcGxleDogLT5cbiAgICAgICAgQGluZGV4LmlzQ29tcGxleCgpXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuXG4jIFJhbmdlcyBjYW4gYmUgdXNlZCB0byBleHRyYWN0IHBvcnRpb25zIChzbGljZXMpIG9mIGFycmF5cyxcbiMgdG8gc3BlY2lmeSBhIHJhbmdlIGZvciBjb21wcmVoZW5zaW9ucywgb3IgYXMgYSB2YWx1ZSwgdG8gYmUgZXhwYW5kZWQgaW50byB0aGVcbiMgY29ycmVzcG9uZGluZyBhcnJheSBvZiBpbnRlZ2VycyBhdCBydW50aW1lLlxuXG5leHBvcnRzLlJhbmdlID0gY2xhc3MgUmFuZ2UgZXh0ZW5kcyBCYXNlXG5cbiAgICBjaGlsZHJlbjogWydmcm9tJywgJ3RvJ11cblxuICAgIEA6IChAZnJvbSwgQHRvLCB0YWcpIC0+XG4gICAgICAgIEBleGNsdXNpdmUgPSB0YWcgaXMgJ2V4Y2x1c2l2ZSdcbiAgICAgICAgQGVxdWFscyA9IGlmIEBleGNsdXNpdmUgdGhlbiAnJyBlbHNlICc9J1xuXG4gICAgIyBDb21waWxlcyB0aGUgcmFuZ2UncyBzb3VyY2UgdmFyaWFibGVzIC0tIHdoZXJlIGl0IHN0YXJ0cyBhbmQgd2hlcmUgaXQgZW5kcy5cbiAgICAjIEJ1dCBvbmx5IGlmIHRoZXkgbmVlZCB0byBiZSBjYWNoZWQgdG8gYXZvaWQgZG91YmxlIGV2YWx1YXRpb24uXG4gICAgXG4gICAgY29tcGlsZVZhcmlhYmxlczogKG8pIC0+XG4gICAgICAgIG8gPSBtZXJnZSBvLCB0b3A6IHRydWVcbiAgICAgICAgaXNDb21wbGV4ID0gZGVsIG8sICdpc0NvbXBsZXgnXG4gICAgICAgIFtAZnJvbUMsIEBmcm9tVmFyXSA9IEBjYWNoZVRvQ29kZUZyYWdtZW50cyBAZnJvbS5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXhcbiAgICAgICAgW0B0b0MsIEB0b1Zhcl0gICAgID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIEB0by5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXhcbiAgICAgICAgW0BzdGVwLCBAc3RlcFZhcl0gID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIHN0ZXAuY2FjaGUgbywgTEVWRUxfTElTVCwgaXNDb21wbGV4IGlmIHN0ZXAgPSBkZWwgbywgJ3N0ZXAnXG4gICAgICAgIEBmcm9tTnVtID0gaWYgQGZyb20uaXNOdW1iZXIoKSB0aGVuIE51bWJlciBAZnJvbVZhciBlbHNlIG51bGxcbiAgICAgICAgQHRvTnVtICAgPSBpZiBAdG8uaXNOdW1iZXIoKSAgIHRoZW4gTnVtYmVyIEB0b1ZhciAgIGVsc2UgbnVsbFxuICAgICAgICBAc3RlcE51bSA9IGlmIHN0ZXA/LmlzTnVtYmVyKCkgdGhlbiBOdW1iZXIgQHN0ZXBWYXIgZWxzZSBudWxsXG5cbiAgICAjIFdoZW4gY29tcGlsZWQgbm9ybWFsbHksIHRoZSByYW5nZSByZXR1cm5zIHRoZSBjb250ZW50cyBvZiB0aGUgKmZvciBsb29wKlxuICAgICMgbmVlZGVkIHRvIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSByYW5nZS4gVXNlZCBieSBjb21wcmVoZW5zaW9ucy5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBjb21waWxlVmFyaWFibGVzIG8gdW5sZXNzIEBmcm9tVmFyXG4gICAgICAgIHJldHVybiBAY29tcGlsZUFycmF5KG8pIHVubGVzcyBvLmluZGV4XG5cbiAgICAgICAgIyBTZXQgdXAgZW5kcG9pbnRzLlxuICAgICAgICBrbm93biAgICA9IEBmcm9tTnVtPyBhbmQgQHRvTnVtP1xuICAgICAgICBpZHggICAgICA9IGRlbCBvLCAnaW5kZXgnXG4gICAgICAgIGlkeE5hbWUgID0gZGVsIG8sICduYW1lJ1xuICAgICAgICBuYW1lZEluZGV4ID0gaWR4TmFtZSBhbmQgaWR4TmFtZSAhPSBpZHhcbiAgICAgICAgdmFyUGFydCAgPSBcIiN7aWR4fSA9ICN7QGZyb21DfVwiXG4gICAgICAgIHZhclBhcnQgKz0gXCIsICN7QHRvQ31cIiBpZiBAdG9DICE9IEB0b1ZhclxuICAgICAgICB2YXJQYXJ0ICs9IFwiLCAje0BzdGVwfVwiIGlmIEBzdGVwICE9IEBzdGVwVmFyXG4gICAgICAgIFtsdCwgZ3RdID0gW1wiI3tpZHh9IDwje0BlcXVhbHN9XCIsIFwiI3tpZHh9ID4je0BlcXVhbHN9XCJdXG5cbiAgICAgICAgIyBHZW5lcmF0ZSB0aGUgY29uZGl0aW9uLlxuICAgICAgICBjb25kUGFydCA9IGlmIEBzdGVwTnVtP1xuICAgICAgICAgICAgaWYgQHN0ZXBOdW0gPiAwIHRoZW4gXCIje2x0fSAje0B0b1Zhcn1cIiBlbHNlIFwiI3tndH0gI3tAdG9WYXJ9XCJcbiAgICAgICAgZWxzZSBpZiBrbm93blxuICAgICAgICAgICAgW2Zyb20sIHRvXSA9IFtAZnJvbU51bSwgQHRvTnVtXVxuICAgICAgICAgICAgaWYgZnJvbSA8PSB0byB0aGVuIFwiI3tsdH0gI3t0b31cIiBlbHNlIFwiI3tndH0gI3t0b31cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25kID0gaWYgQHN0ZXBWYXIgdGhlbiBcIiN7QHN0ZXBWYXJ9ID4gMFwiIGVsc2UgXCIje0Bmcm9tVmFyfSA8PSAje0B0b1Zhcn1cIlxuICAgICAgICAgICAgXCIje2NvbmR9ID8gI3tsdH0gI3tAdG9WYXJ9IDogI3tndH0gI3tAdG9WYXJ9XCJcblxuICAgICAgICAjIEdlbmVyYXRlIHRoZSBzdGVwLlxuICAgICAgICBzdGVwUGFydCA9IGlmIEBzdGVwVmFyXG4gICAgICAgICAgICBcIiN7aWR4fSArPSAje0BzdGVwVmFyfVwiXG4gICAgICAgIGVsc2UgaWYga25vd25cbiAgICAgICAgICAgIGlmIG5hbWVkSW5kZXhcbiAgICAgICAgICAgICAgICBpZiBmcm9tIDw9IHRvIHRoZW4gXCIrKyN7aWR4fVwiIGVsc2UgXCItLSN7aWR4fVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgZnJvbSA8PSB0byB0aGVuIFwiI3tpZHh9KytcIiBlbHNlIFwiI3tpZHh9LS1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBuYW1lZEluZGV4XG4gICAgICAgICAgICAgICAgXCIje2NvbmR9ID8gKysje2lkeH0gOiAtLSN7aWR4fVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCIje2NvbmR9ID8gI3tpZHh9KysgOiAje2lkeH0tLVwiXG5cbiAgICAgICAgdmFyUGFydCAgPSBcIiN7aWR4TmFtZX0gPSAje3ZhclBhcnR9XCIgaWYgbmFtZWRJbmRleFxuICAgICAgICBzdGVwUGFydCA9IFwiI3tpZHhOYW1lfSA9ICN7c3RlcFBhcnR9XCIgaWYgbmFtZWRJbmRleFxuXG4gICAgICAgICMgVGhlIGZpbmFsIGxvb3AgYm9keS5cbiAgICAgICAgW0BtYWtlQ29kZSBcIiN7dmFyUGFydH07ICN7Y29uZFBhcnR9OyAje3N0ZXBQYXJ0fVwiXVxuXG5cbiAgICAjIFdoZW4gdXNlZCBhcyBhIHZhbHVlLCBleHBhbmQgdGhlIHJhbmdlIGludG8gdGhlIGVxdWl2YWxlbnQgYXJyYXkuXG4gICAgY29tcGlsZUFycmF5OiAobykgLT5cbiAgICAgICAga25vd24gPSBAZnJvbU51bT8gYW5kIEB0b051bT9cbiAgICAgICAgaWYga25vd24gYW5kIE1hdGguYWJzKEBmcm9tTnVtIC0gQHRvTnVtKSA8PSAyMFxuICAgICAgICAgICAgcmFuZ2UgPSBbQGZyb21OdW0uLkB0b051bV1cbiAgICAgICAgICAgIHJhbmdlLnBvcCgpIGlmIEBleGNsdXNpdmVcbiAgICAgICAgICAgIHJldHVybiBbQG1ha2VDb2RlIFwiWyN7IHJhbmdlLmpvaW4oJywgJykgfV1cIl1cbiAgICAgICAgaWR0ICAgID0gQHRhYiArIFRBQlxuICAgICAgICBpICAgICAgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnaScsIHNpbmdsZTogdHJ1ZVxuICAgICAgICByZXN1bHQgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVzdWx0cydcbiAgICAgICAgcHJlICAgID0gXCJcXG4je2lkdH0je3Jlc3VsdH0gPSBbXTtcIlxuICAgICAgICBpZiBrbm93blxuICAgICAgICAgICAgby5pbmRleCA9IGlcbiAgICAgICAgICAgIGJvZHkgPSBAZnJhZ21lbnRzVG9UZXh0IEBjb21waWxlTm9kZSBvXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhcnMgPSBcIiN7aX0gPSAje0Bmcm9tQ31cIiArIGlmIEB0b0MgIT0gQHRvVmFyIHRoZW4gXCIsICN7QHRvQ31cIiBlbHNlICcnXG4gICAgICAgICAgICBjb25kID0gXCIje0Bmcm9tVmFyfSA8PSAje0B0b1Zhcn1cIlxuICAgICAgICAgICAgYm9keSA9IFwidmFyICN7dmFyc307ICN7Y29uZH0gPyAje2l9IDwje0BlcXVhbHN9ICN7QHRvVmFyfSA6ICN7aX0gPiN7QGVxdWFsc30gI3tAdG9WYXJ9OyAje2NvbmR9ID8gI3tpfSsrIDogI3tpfS0tXCJcbiAgICAgICAgcG9zdCAgICAgPSBcInsgI3tyZXN1bHR9LnB1c2goI3tpfSk7IH1cXG4je2lkdH1yZXR1cm4gI3tyZXN1bHR9O1xcbiN7by5pbmRlbnR9XCJcbiAgICAgICAgaGFzQXJncyA9IChub2RlKSAtPiBub2RlPy5jb250YWlucyBpc0xpdGVyYWxBcmd1bWVudHNcbiAgICAgICAgYXJncyAgICA9ICcsIGFyZ3VtZW50cycgaWYgaGFzQXJncyhAZnJvbSkgb3IgaGFzQXJncyhAdG8pXG4gICAgICAgIFtAbWFrZUNvZGUgXCIoZnVuY3Rpb24oKSB7I3twcmV9XFxuI3tpZHR9Zm9yICgje2JvZHl9KSN7cG9zdH19KS5hcHBseSh0aGlzI3thcmdzID8gJyd9KVwiXVxuXG4jICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jICAgICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQW4gYXJyYXkgc2xpY2UgbGl0ZXJhbC4gVW5saWtlIEphdmFTY3JpcHQncyBgQXJyYXkjc2xpY2VgLCB0aGUgc2Vjb25kIHBhcmFtZXRlclxuIyBzcGVjaWZpZXMgdGhlIGluZGV4IG9mIHRoZSBlbmQgb2YgdGhlIHNsaWNlLCBqdXN0IGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXJcbiMgaXMgdGhlIGluZGV4IG9mIHRoZSBiZWdpbm5pbmcuXG5cbmV4cG9ydHMuU2xpY2UgPSBjbGFzcyBTbGljZSBleHRlbmRzIEJhc2VcblxuICAgIGNoaWxkcmVuOiBbJ3JhbmdlJ11cblxuICAgIEA6IChAcmFuZ2UpIC0+IHN1cGVyKClcblxuICAgICMgV2UgaGF2ZSB0byBiZSBjYXJlZnVsIHdoZW4gdHJ5aW5nIHRvIHNsaWNlIHRocm91Z2ggdGhlIGVuZCBvZiB0aGUgYXJyYXksXG4gICAgIyBgOWU5YCBpcyB1c2VkIGJlY2F1c2Ugbm90IGFsbCBpbXBsZW1lbnRhdGlvbnMgcmVzcGVjdCBgdW5kZWZpbmVkYCBvciBgMS8wYC5cbiAgICAjIGA5ZTlgIHNob3VsZCBiZSBzYWZlIGJlY2F1c2UgYDllOWAgPiBgMioqMzJgLCB0aGUgbWF4IGFycmF5IGxlbmd0aC5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICB7dG8sIGZyb219ID0gQHJhbmdlXG4gICAgICAgIGZyb21Db21waWxlZCA9IGZyb20gYW5kIGZyb20uY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSBvciBbQG1ha2VDb2RlICcwJ11cbiAgICAgICAgIyBUT0RPOiBqd2FsdG9uIC0gbW92ZSB0aGlzIGludG8gdGhlICdpZic/XG4gICAgICAgIGlmIHRvXG4gICAgICAgICAgICBjb21waWxlZCAgICAgICAgID0gdG8uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgICAgICBjb21waWxlZFRleHQgPSBAZnJhZ21lbnRzVG9UZXh0IGNvbXBpbGVkXG4gICAgICAgICAgICBpZiBub3QgKG5vdCBAcmFuZ2UuZXhjbHVzaXZlIGFuZCArY29tcGlsZWRUZXh0IGlzIC0xKVxuICAgICAgICAgICAgICAgIHRvU3RyID0gJywgJyArIGlmIEByYW5nZS5leGNsdXNpdmVcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRUZXh0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiB0by5pc051bWJlcigpXG4gICAgICAgICAgICAgICAgICAgIFwiI3srY29tcGlsZWRUZXh0ICsgMX1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY29tcGlsZWQgPSB0by5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfQUNDRVNTXG4gICAgICAgICAgICAgICAgICAgIFwiKyN7QGZyYWdtZW50c1RvVGV4dCBjb21waWxlZH0gKyAxIHx8IDllOVwiXG4gICAgICAgIFtAbWFrZUNvZGUgXCIuc2xpY2UoI3sgQGZyYWdtZW50c1RvVGV4dCBmcm9tQ29tcGlsZWQgfSN7IHRvU3RyIG9yICcnIH0pXCJdXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuT2JqID0gY2xhc3MgT2JqIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChwcm9wcywgQGdlbmVyYXRlZCA9IGZhbHNlKSAtPlxuICAgICAgICBAb2JqZWN0cyA9IEBwcm9wZXJ0aWVzID0gcHJvcHMgb3IgW11cblxuICAgIGNoaWxkcmVuOiBbJ3Byb3BlcnRpZXMnXVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBwcm9wcyA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIEBnZW5lcmF0ZWRcbiAgICAgICAgICAgIGZvciBub2RlIGluIHByb3BzIHdoZW4gbm9kZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgICAgICAgICAgbm9kZS5lcnJvciAnY2Fubm90IGhhdmUgYW4gaW1wbGljaXQgdmFsdWUgaW4gYW4gaW1wbGljaXQgb2JqZWN0J1xuICAgICAgICBicmVhayBmb3IgcHJvcCwgZHluYW1pY0luZGV4IGluIHByb3BzIHdoZW4gKHByb3AudmFyaWFibGUgb3IgcHJvcCkuYmFzZSBpbnN0YW5jZW9mIFBhcmVuc1xuICAgICAgICBoYXNEeW5hbWljICA9IGR5bmFtaWNJbmRleCA8IHByb3BzLmxlbmd0aFxuICAgICAgICBpZHQgICAgICAgICA9IG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBsYXN0Tm9uY29tICA9IEBsYXN0Tm9uQ29tbWVudCBAcHJvcGVydGllc1xuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICBpZiBoYXNEeW5hbWljXG4gICAgICAgICAgICBvcmVmID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ29iaidcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIihcXG4je2lkdH0je29yZWZ9ID0gXCJcbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwieyN7aWYgcHJvcHMubGVuZ3RoIGlzIDAgb3IgZHluYW1pY0luZGV4IGlzIDAgdGhlbiAnfScgZWxzZSAnXFxuJ31cIlxuICAgICAgICBmb3IgcHJvcCwgaSBpbiBwcm9wc1xuICAgICAgICAgICAgaWYgaSBpcyBkeW5hbWljSW5kZXhcbiAgICAgICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJcXG4je2lkdH19XCIgdW5sZXNzIGkgaXMgMFxuICAgICAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSAnLFxcbidcbiAgICAgICAgICAgIGpvaW4gPSBpZiBpIGlzIHByb3BzLmxlbmd0aCAtIDEgb3IgaSBpcyBkeW5hbWljSW5kZXggLSAxXG4gICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgIGVsc2UgaWYgcHJvcCBpcyBsYXN0Tm9uY29tIG9yIHByb3AgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgJ1xcbidcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAnLFxcbidcbiAgICAgICAgICAgIGluZGVudCA9IGlmIHByb3AgaW5zdGFuY2VvZiBDb21tZW50IHRoZW4gJycgZWxzZSBpZHRcbiAgICAgICAgICAgIGluZGVudCArPSBUQUIgaWYgaGFzRHluYW1pYyBhbmQgaSA8IGR5bmFtaWNJbmRleFxuICAgICAgICAgICAgaWYgcHJvcCBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgIGlmIHByb3AuY29udGV4dCAhPSAnb2JqZWN0J1xuICAgICAgICAgICAgICAgICAgICBwcm9wLm9wZXJhdG9yVG9rZW4uZXJyb3IgXCJ1bmV4cGVjdGVkICN7cHJvcC5vcGVyYXRvclRva2VuLnZhbHVlfVwiXG4gICAgICAgICAgICAgICAgaWYgcHJvcC52YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBwcm9wLnZhcmlhYmxlLmhhc1Byb3BlcnRpZXMoKVxuICAgICAgICAgICAgICAgICAgICBwcm9wLnZhcmlhYmxlLmVycm9yICdpbnZhbGlkIG9iamVjdCBrZXknXG4gICAgICAgICAgICBpZiBwcm9wIGluc3RhbmNlb2YgVmFsdWUgYW5kIHByb3AudGhpc1xuICAgICAgICAgICAgICAgIHByb3AgPSBuZXcgQXNzaWduIHByb3AucHJvcGVydGllc1swXS5uYW1lLCBwcm9wLCAnb2JqZWN0J1xuICAgICAgICAgICAgaWYgcHJvcCBub3QgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgaWYgaSA8IGR5bmFtaWNJbmRleFxuICAgICAgICAgICAgICAgICAgICBpZiBwcm9wIG5vdCBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcCA9IG5ldyBBc3NpZ24gcHJvcCwgcHJvcCwgJ29iamVjdCdcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIHByb3AgaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IHByb3AudmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBba2V5LCB2YWx1ZV0gPSBwcm9wLmJhc2UuY2FjaGUgb1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gbmV3IFByb3BlcnR5TmFtZSBrZXkudmFsdWUgaWYga2V5IGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgcHJvcCA9IG5ldyBBc3NpZ24gKG5ldyBWYWx1ZSAobmV3IElkZW50aWZpZXJMaXRlcmFsIG9yZWYpLCBbbmV3IEFjY2VzcyBrZXldKSwgdmFsdWVcbiAgICAgICAgICAgIGlmIGluZGVudCB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBpbmRlbnRcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIHByb3AuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1RPUCkuLi5cbiAgICAgICAgICAgIGlmIGpvaW4gdGhlbiBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgam9pblxuICAgICAgICBpZiBoYXNEeW5hbWljXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCIsXFxuI3tpZHR9I3tvcmVmfVxcbiN7QHRhYn0pXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiXFxuI3tAdGFifX1cIiB1bmxlc3MgcHJvcHMubGVuZ3RoIGlzIDBcbiAgICAgICAgaWYgQGZyb250IGFuZCBub3QgaGFzRHluYW1pYyB0aGVuIEB3cmFwSW5CcmFjZXMgYW5zd2VyIGVsc2UgYW5zd2VyXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgZm9yIHByb3AgaW4gQHByb3BlcnRpZXMgd2hlbiBwcm9wLmFzc2lnbnMgbmFtZSB0aGVuIHJldHVybiB5ZXNcbiAgICAgICAgbm9cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5BcnIgPSBjbGFzcyBBcnIgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKG9ianMpIC0+XG4gICAgICAgIEBvYmplY3RzID0gb2JqcyBvciBbXVxuXG4gICAgY2hpbGRyZW46IFsnb2JqZWN0cyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIHJldHVybiBbQG1ha2VDb2RlICdbXSddIHVubGVzcyBAb2JqZWN0cy5sZW5ndGhcbiAgICAgICAgby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIGFuc3dlciA9IFNwbGF0LmNvbXBpbGVTcGxhdHRlZEFycmF5IG8sIEBvYmplY3RzXG4gICAgICAgIHJldHVybiBhbnN3ZXIgaWYgYW5zd2VyLmxlbmd0aFxuXG4gICAgICAgIGFuc3dlciA9IFtdXG4gICAgICAgIGNvbXBpbGVkT2JqcyA9IChvYmouY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1QgZm9yIG9iaiBpbiBAb2JqZWN0cylcbiAgICAgICAgZm9yIGZyYWdtZW50cywgaW5kZXggaW4gY29tcGlsZWRPYmpzXG4gICAgICAgICAgICBpZiBpbmRleFxuICAgICAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIiwgXCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIGZyYWdtZW50cy4uLlxuICAgICAgICBpZiBAZnJhZ21lbnRzVG9UZXh0KGFuc3dlcikuaW5kZXhPZignXFxuJykgPj0gMFxuICAgICAgICAgICAgYW5zd2VyLnVuc2hpZnQgQG1ha2VDb2RlIFwiW1xcbiN7by5pbmRlbnR9XCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIlxcbiN7QHRhYn1dXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyLnVuc2hpZnQgQG1ha2VDb2RlIFwiW1wiXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJdXCJcbiAgICAgICAgYW5zd2VyXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cyB3aGVuIG9iai5hc3NpZ25zIG5hbWUgdGhlbiByZXR1cm4geWVzXG4gICAgICAgIG5vXG5cbiMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBUaGUgY2xhc3MgZGVmaW5pdGlvbi4gSW5pdGlhbGl6ZSBhIENsYXNzIHdpdGggaXRzIG5hbWUsIGFuIG9wdGlvbmFsIHN1cGVyY2xhc3MsIGFuZCBhIGxpc3Qgb2YgcHJvdG90eXBlIHByb3BlcnR5IGFzc2lnbm1lbnRzLlxuXG5leHBvcnRzLkNsYXNzID0gY2xhc3MgQ2xhc3MgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEB2YXJpYWJsZSwgQHBhcmVudCwgQGJvZHkgPSBuZXcgQmxvY2spIC0+XG4gICAgICAgIEBib3VuZEZ1bmNzID0gW11cbiAgICAgICAgQGJvZHkuY2xhc3NCb2R5ID0geWVzXG5cbiAgICBjaGlsZHJlbjogWyd2YXJpYWJsZScsICdwYXJlbnQnLCAnYm9keSddXG5cbiAgICBkZWZhdWx0Q2xhc3NWYXJpYWJsZU5hbWU6ICdfQ2xhc3MnXG5cbiAgICAjIEZpZ3VyZSBvdXQgdGhlIGFwcHJvcHJpYXRlIG5hbWUgZm9yIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBvZiB0aGlzIGNsYXNzLlxuICAgICAgICBcbiAgICBkZXRlcm1pbmVOYW1lOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBkZWZhdWx0Q2xhc3NWYXJpYWJsZU5hbWUgdW5sZXNzIEB2YXJpYWJsZVxuICAgICAgICBbLi4uLCB0YWlsXSA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzXG4gICAgICAgIG5vZGUgPSBpZiB0YWlsXG4gICAgICAgICAgICB0YWlsIGluc3RhbmNlb2YgQWNjZXNzIGFuZCB0YWlsLm5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHZhcmlhYmxlLmJhc2VcbiAgICAgICAgdW5sZXNzIG5vZGUgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCBvciBub2RlIGluc3RhbmNlb2YgUHJvcGVydHlOYW1lXG4gICAgICAgICAgICByZXR1cm4gQGRlZmF1bHRDbGFzc1ZhcmlhYmxlTmFtZVxuICAgICAgICBuYW1lID0gbm9kZS52YWx1ZVxuICAgICAgICB1bmxlc3MgdGFpbFxuICAgICAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIG5hbWVcbiAgICAgICAgICAgIEB2YXJpYWJsZS5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgaWYgbmFtZSBpbiBKU19GT1JCSURERU4gdGhlbiBcIl8je25hbWV9XCIgZWxzZSBuYW1lXG5cbiAgICAjIEZvciBhbGwgYHRoaXNgLXJlZmVyZW5jZXMgYW5kIGJvdW5kIGZ1bmN0aW9ucyBpbiB0aGUgY2xhc3MgZGVmaW5pdGlvbiwgYHRoaXNgIGlzIHRoZSBDbGFzcyBiZWluZyBjb25zdHJ1Y3RlZC5cbiAgICAgICAgXG4gICAgc2V0Q29udGV4dDogKG5hbWUpIC0+XG4gICAgICAgIFxuICAgICAgICBAYm9keS50cmF2ZXJzZUNoaWxkcmVuIGZhbHNlLCAobm9kZSkgLT5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBub2RlLmNsYXNzQm9keVxuICAgICAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIFRoaXNMaXRlcmFsXG4gICAgICAgICAgICAgICAgbm9kZS52YWx1ZSAgICAgID0gbmFtZVxuICAgICAgICAgICAgZWxzZSBpZiBub2RlIGluc3RhbmNlb2YgQ29kZVxuICAgICAgICAgICAgICAgIG5vZGUuY29udGV4dCAgICA9IG5hbWUgaWYgbm9kZS5ib3VuZFxuXG4gICAgIyBFbnN1cmUgdGhhdCBhbGwgZnVuY3Rpb25zIGJvdW5kIHRvIHRoZSBpbnN0YW5jZSBhcmUgcHJveGllZCBpbiB0aGUgY29uc3RydWN0b3IuXG4gICAgXG4gICAgYWRkQm91bmRGdW5jdGlvbnM6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGJ2YXIgaW4gQGJvdW5kRnVuY3NcbiAgICAgICAgICAgIGxocyA9IChuZXcgVmFsdWUgKG5ldyBUaGlzTGl0ZXJhbCksIFtuZXcgQWNjZXNzIGJ2YXJdKS5jb21waWxlIG9cbiAgICAgICAgICAgIEBjdG9yLmJvZHkudW5zaGlmdCBuZXcgTGl0ZXJhbCBcIiN7bGhzfSA9ICN7dXRpbGl0eSAnYmluZCcsIG99KCN7bGhzfSwgdGhpcylcIlxuICAgICAgICByZXR1cm5cblxuICAgICMgTWVyZ2UgdGhlIHByb3BlcnRpZXMgZnJvbSBhIHRvcC1sZXZlbCBvYmplY3QgYXMgcHJvdG90eXBhbCBwcm9wZXJ0aWVzIG9uIHRoZSBjbGFzcy5cbiAgICBcbiAgICBhZGRQcm9wZXJ0aWVzOiAobm9kZSwgbmFtZSwgbykgLT5cbiAgICAgICAgXG4gICAgICAgIHByb3BzID0gbm9kZS5iYXNlLnByb3BlcnRpZXNbLi5dXG4gICAgICAgIGV4cHJzID0gd2hpbGUgYXNzaWduID0gcHJvcHMuc2hpZnQoKVxuICAgICAgICAgICAgaWYgYXNzaWduIGluc3RhbmNlb2YgQXNzaWduXG4gICAgICAgICAgICAgICAgYmFzZSA9IGFzc2lnbi52YXJpYWJsZS5iYXNlXG4gICAgICAgICAgICAgICAgZGVsZXRlIGFzc2lnbi5jb250ZXh0XG4gICAgICAgICAgICAgICAgZnVuYyA9IGFzc2lnbi52YWx1ZVxuICAgICAgICAgICAgICAgIGlmIGJhc2UudmFsdWUgaXMgJ2NvbnN0cnVjdG9yJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAY3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWduLmVycm9yICdjYW5ub3QgZGVmaW5lIG1vcmUgdGhhbiBvbmUgY29uc3RydWN0b3IgaW4gYSBjbGFzcydcbiAgICAgICAgICAgICAgICAgICAgaWYgZnVuYy5ib3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWduLmVycm9yICdjYW5ub3QgZGVmaW5lIGEgY29uc3RydWN0b3IgYXMgYSBib3VuZCBmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgaWYgZnVuYyBpbnN0YW5jZW9mIENvZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbiA9IEBjdG9yID0gZnVuY1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAZXh0ZXJuYWxDdG9yID0gby5jbGFzc1Njb3BlLmZyZWVWYXJpYWJsZSAnY3RvcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbiA9IG5ldyBBc3NpZ24gbmV3IElkZW50aWZpZXJMaXRlcmFsKEBleHRlcm5hbEN0b3IpLCBmdW5jXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBhc3NpZ24udmFyaWFibGUudGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5zdGF0aWMgPSB5ZXNcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gaWYgYmFzZS5pc0NvbXBsZXgoKSB0aGVuIG5ldyBJbmRleCBiYXNlIGVsc2UgbmV3IEFjY2VzcyBiYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ24udmFyaWFibGUgPSBuZXcgVmFsdWUobmV3IElkZW50aWZpZXJMaXRlcmFsKG5hbWUpLCBbKG5ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAncHJvdG90eXBlJyksIGFjY10pXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBmdW5jIGluc3RhbmNlb2YgQ29kZSBhbmQgZnVuYy5ib3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBib3VuZEZ1bmNzLnB1c2ggYmFzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMuYm91bmQgPSBub1xuICAgICAgICAgICAgYXNzaWduXG5cbiAgICAgICAgY29tcGFjdCBleHByc1xuXG4gICAgIyBXYWxrIHRoZSBib2R5IG9mIHRoZSBjbGFzcywgbG9va2luZyBmb3IgcHJvdG90eXBlIHByb3BlcnRpZXMgdG8gYmUgY29udmVydGVkIGFuZCB0YWdnaW5nIHN0YXRpYyBhc3NpZ25tZW50cy5cbiAgICAgICAgXG4gICAgd2Fsa0JvZHk6IChuYW1lLCBvKSAtPlxuICAgICAgICAjbG9nICd3YWxrQm9keScsIG8uZmVhdHVyZVxuICAgICAgICBAdHJhdmVyc2VDaGlsZHJlbiBmYWxzZSwgKGNoaWxkKSA9PlxuICAgICAgICAgICAgY29udCA9IHRydWVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSBpZiBjaGlsZCBpbnN0YW5jZW9mIENsYXNzXG4gICAgICAgICAgICBpZiBjaGlsZCBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICAgICAgZm9yIG5vZGUsIGkgaW4gZXhwcyA9IGNoaWxkLmV4cHJlc3Npb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG5vZGUudmFyaWFibGUubG9va3NTdGF0aWMgbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS52YWx1ZS5zdGF0aWMgPSB5ZXNcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBub2RlIGluc3RhbmNlb2YgVmFsdWUgYW5kIG5vZGUuaXNPYmplY3QodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwc1tpXSA9IEBhZGRQcm9wZXJ0aWVzIG5vZGUsIG5hbWUsIG9cbiAgICAgICAgICAgICAgICBjaGlsZC5leHByZXNzaW9ucyA9IGV4cHMgPSBmbGF0dGVuIGV4cHNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBjaGlsZC5jbGFzc0JvZHkgYW5kIGhhc0ZlYXR1cmUgbywgJ2NvbmZpZ19wYXJhbWV0ZXJzJ1xuICAgICAgICAgICAgICAgICAgICBAcHJlcGFyZVN1cGVyQ2FsbEZvckNvbmZpZ1BhcmFtcyBuYW1lLCBvLCBjaGlsZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udCBhbmQgY2hpbGQgbm90IGluc3RhbmNlb2YgQ2xhc3NcblxuICAgIHByZXBhcmVTdXBlckNhbGxGb3JDb25maWdQYXJhbXM6IChuYW1lLCBvLCBjbGFzc0JvZHkpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgZXhwciBpbiBjbGFzc0JvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGlmIGV4cHIgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgbm90IGV4cHIucGFyYW1zWzBdPy5uYW1lXG4gICAgICAgICAgICAgICAgcGFyYW0wID0gZXhwci5wYXJhbXNbMF0ubmFtZVxuICAgICAgICAgICAgICAgIGlmIG5vdCBwYXJhbTAuZ2VuZXJhdGVkIHRoZW4gcmV0dXJuICMgdGhpcyBlbnN1cmUgdGhhdCB0aGlzIGZlYXR1cmUgaXMgb25seSBhY3RpdmUgd2hlbiB1c2luZyB0aGUgc2hvcnRjdXRcbiAgICAgICAgICAgICAgICBpZiBub3QgcGFyYW0wIGluc3RhbmNlb2YgT2JqIHRoZW4gcmV0dXJuIGxvZyAnQ09OU1RSVUNUT1IgUEFSQU0wIE5PVCBBTiBPQko/J1xuICAgICAgICAgICAgICAgIGlmIG5vdCBleHByLmJvZHkgaW5zdGFuY2VvZiBCbG9jayB0aGVuIHJldHVybiBsb2cgJ0NPTlNUUlVDVE9SIEJPRFkgTk9UIEFOIEJMT0NLPydcbiAgICAgICAgICAgICAgICBmb3IgYm9keUV4cHIgaW4gZXhwci5ib2R5LmV4cHJlc3Npb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIGJvZHlFeHByIGluc3RhbmNlb2YgU3VwZXJDYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5RXhwci5jb25maWdQYXJhbWV0ZXIgPSBwYXJhbTBcbiAgICAgICAgICAgIFxuICAgICMgYHVzZSBzdHJpY3RgIChhbmQgb3RoZXIgZGlyZWN0aXZlcykgbXVzdCBiZSB0aGUgZmlyc3QgZXhwcmVzc2lvbiBzdGF0ZW1lbnQocylcbiAgICAjIG9mIGEgZnVuY3Rpb24gYm9keS4gVGhpcyBtZXRob2QgZW5zdXJlcyB0aGUgcHJvbG9ndWUgaXMgY29ycmVjdGx5IHBvc2l0aW9uZWRcbiAgICAjIGFib3ZlIHRoZSBgY29uc3RydWN0b3JgLlxuICAgIFxuICAgIGhvaXN0RGlyZWN0aXZlUHJvbG9ndWU6IC0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IDBcbiAgICAgICAge2V4cHJlc3Npb25zfSA9IEBib2R5XG4gICAgICAgICsraW5kZXggd2hpbGUgKG5vZGUgPSBleHByZXNzaW9uc1tpbmRleF0pIGFuZCBub2RlIGluc3RhbmNlb2YgQ29tbWVudCBvclxuICAgICAgICAgICAgbm9kZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBub2RlLmlzU3RyaW5nKClcbiAgICAgICAgQGRpcmVjdGl2ZXMgPSBleHByZXNzaW9ucy5zcGxpY2UgMCwgaW5kZXhcblxuICAgICMgTWFrZSBzdXJlIHRoYXQgYSBjb25zdHJ1Y3RvciBpcyBkZWZpbmVkIGZvciB0aGUgY2xhc3MsIGFuZCBwcm9wZXJseSBjb25maWd1cmVkLlxuICAgICAgICBcbiAgICBlbnN1cmVDb25zdHJ1Y3RvcjogKG5hbWUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGN0b3JcbiAgICAgICAgICAgIEBjdG9yID0gbmV3IENvZGVcbiAgICAgICAgICAgIGlmIEBleHRlcm5hbEN0b3JcbiAgICAgICAgICAgICAgICBAY3Rvci5ib2R5LnB1c2ggbmV3IExpdGVyYWwgXCIje0BleHRlcm5hbEN0b3J9LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcIlxuICAgICAgICAgICAgZWxzZSBpZiBAcGFyZW50XG4gICAgICAgICAgICAgICAgQGN0b3IuYm9keS5wdXNoIG5ldyBMaXRlcmFsIFwiI3tuYW1lfS5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKVwiXG4gICAgICAgICAgICBAY3Rvci5ib2R5Lm1ha2VSZXR1cm4oKVxuICAgICAgICAgICAgQGJvZHkuZXhwcmVzc2lvbnMudW5zaGlmdCBAY3RvclxuICAgICAgICBAY3Rvci5jdG9yID0gQGN0b3IubmFtZSA9IG5hbWVcbiAgICAgICAgQGN0b3Iua2xhc3MgPSBudWxsXG4gICAgICAgIEBjdG9yLm5vUmV0dXJuID0geWVzXG5cbiAgICAjIEluc3RlYWQgb2YgZ2VuZXJhdGluZyB0aGUgSmF2YVNjcmlwdCBzdHJpbmcgZGlyZWN0bHksIHdlIGJ1aWxkIHVwIHRoZVxuICAgICMgZXF1aXZhbGVudCBzeW50YXggdHJlZSBhbmQgY29tcGlsZSB0aGF0LCBpbiBwaWVjZXMuIFlvdSBjYW4gc2VlIHRoZVxuICAgICMgY29uc3RydWN0b3IsIHByb3BlcnR5IGFzc2lnbm1lbnRzLCBhbmQgaW5oZXJpdGFuY2UgZ2V0dGluZyBidWlsdCBvdXQgYmVsb3cuXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYganVtcE5vZGUgPSBAYm9keS5qdW1wcygpXG4gICAgICAgICAgICBqdW1wTm9kZS5lcnJvciAnQ2xhc3MgYm9kaWVzIGNhbm5vdCBjb250YWluIHB1cmUgc3RhdGVtZW50cydcbiAgICAgICAgaWYgYXJndW1lbnRzTm9kZSA9IEBib2R5LmNvbnRhaW5zIGlzTGl0ZXJhbEFyZ3VtZW50c1xuICAgICAgICAgICAgYXJndW1lbnRzTm9kZS5lcnJvciBcIkNsYXNzIGJvZGllcyBzaG91bGRuJ3QgcmVmZXJlbmNlIGFyZ3VtZW50c1wiXG5cbiAgICAgICAgbmFtZSAgPSBAZGV0ZXJtaW5lTmFtZSgpXG4gICAgICAgIGxuYW1lID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG5hbWVcbiAgICAgICAgZnVuYyAgPSBuZXcgQ29kZSBbXSwgQmxvY2sud3JhcCBbQGJvZHldXG4gICAgICAgIGFyZ3MgID0gW11cbiAgICAgICAgby5jbGFzc1Njb3BlID0gZnVuYy5tYWtlU2NvcGUgby5zY29wZVxuXG4gICAgICAgIEBob2lzdERpcmVjdGl2ZVByb2xvZ3VlKClcbiAgICAgICAgQHNldENvbnRleHQgbmFtZVxuICAgICAgICBAd2Fsa0JvZHkgbmFtZSwgb1xuICAgICAgICBAZW5zdXJlQ29uc3RydWN0b3IgbmFtZVxuICAgICAgICBAYWRkQm91bmRGdW5jdGlvbnMgb1xuICAgICAgICBAYm9keS5zcGFjZWQgPSB5ZXNcbiAgICAgICAgQGJvZHkuZXhwcmVzc2lvbnMucHVzaCBsbmFtZVxuXG4gICAgICAgIGlmIEBwYXJlbnRcbiAgICAgICAgICAgIHN1cGVyQ2xhc3MgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5jbGFzc1Njb3BlLmZyZWVWYXJpYWJsZSAnc3VwZXJDbGFzcycsIHJlc2VydmU6IG5vXG4gICAgICAgICAgICBAYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IG5ldyBFeHRlbmRzIGxuYW1lLCBzdXBlckNsYXNzXG4gICAgICAgICAgICBmdW5jLnBhcmFtcy5wdXNoIG5ldyBQYXJhbSBzdXBlckNsYXNzXG4gICAgICAgICAgICBhcmdzLnB1c2ggQHBhcmVudFxuXG4gICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgQGRpcmVjdGl2ZXMuLi5cblxuICAgICAgICBrbGFzcyA9IG5ldyBQYXJlbnMgbmV3IENhbGwgZnVuYywgYXJnc1xuICAgICAgICBrbGFzcyA9IG5ldyBBc3NpZ24gQHZhcmlhYmxlLCBrbGFzcywgbnVsbCwgeyBAbW9kdWxlRGVjbGFyYXRpb24gfSBpZiBAdmFyaWFibGVcbiAgICAgICAga2xhc3MuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbmV4cG9ydHMuTW9kdWxlRGVjbGFyYXRpb24gPSBjbGFzcyBNb2R1bGVEZWNsYXJhdGlvbiBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGNsYXVzZSwgQHNvdXJjZSkgLT5cbiAgICAgICAgQGNoZWNrU291cmNlKClcblxuICAgIGNoaWxkcmVuOiBbJ2NsYXVzZScsICdzb3VyY2UnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIGp1bXBzOiAgICAgICBUSElTXG4gICAgbWFrZVJldHVybjogIFRISVNcblxuICAgIGNoZWNrU291cmNlOiAtPlxuICAgICAgICBpZiBAc291cmNlPyBhbmQgQHNvdXJjZSBpbnN0YW5jZW9mIFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9uc1xuICAgICAgICAgICAgQHNvdXJjZS5lcnJvciAndGhlIG5hbWUgb2YgdGhlIG1vZHVsZSB0byBiZSBpbXBvcnRlZCBmcm9tIG11c3QgYmUgYW4gdW5pbnRlcnBvbGF0ZWQgc3RyaW5nJ1xuXG4gICAgY2hlY2tTY29wZTogKG8sIG1vZHVsZURlY2xhcmF0aW9uVHlwZSkgLT5cbiAgICAgICAgaWYgby5pbmRlbnQubGVuZ3RoICE9IDBcbiAgICAgICAgICAgIEBlcnJvciBcIiN7bW9kdWxlRGVjbGFyYXRpb25UeXBlfSBzdGF0ZW1lbnRzIG11c3QgYmUgYXQgdG9wLWxldmVsIHNjb3BlXCJcblxuIyAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuSW1wb3J0RGVjbGFyYXRpb24gPSBjbGFzcyBJbXBvcnREZWNsYXJhdGlvbiBleHRlbmRzIE1vZHVsZURlY2xhcmF0aW9uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBAY2hlY2tTY29wZSBvLCAnaW1wb3J0J1xuICAgICAgICBvLmltcG9ydGVkU3ltYm9scyA9IFtdXG5cbiAgICAgICAgY29kZSA9IFtdXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCIje0B0YWJ9aW1wb3J0IFwiXG4gICAgICAgIGNvZGUucHVzaCBAY2xhdXNlLmNvbXBpbGVOb2RlKG8pLi4uIGlmIEBjbGF1c2U/XG5cbiAgICAgICAgaWYgQHNvdXJjZT8udmFsdWU/XG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICcgZnJvbSAnIHVubGVzcyBAY2xhdXNlIGlzIG51bGxcbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgQHNvdXJjZS52YWx1ZVxuXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJzsnXG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRDbGF1c2UgPSBjbGFzcyBJbXBvcnRDbGF1c2UgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBkZWZhdWx0QmluZGluZywgQG5hbWVkSW1wb3J0cykgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2RlZmF1bHRCaW5kaW5nJywgJ25hbWVkSW1wb3J0cyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGNvZGUgPSBbXVxuXG4gICAgICAgIGlmIEBkZWZhdWx0QmluZGluZz9cbiAgICAgICAgICAgIGNvZGUucHVzaCBAZGVmYXVsdEJpbmRpbmcuY29tcGlsZU5vZGUobykuLi5cbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJywgJyBpZiBAbmFtZWRJbXBvcnRzP1xuXG4gICAgICAgIGlmIEBuYW1lZEltcG9ydHM/XG4gICAgICAgICAgICBjb2RlLnB1c2ggQG5hbWVkSW1wb3J0cy5jb21waWxlTm9kZShvKS4uLlxuXG4gICAgICAgIGNvZGVcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG5leHBvcnRzLkV4cG9ydERlY2xhcmF0aW9uID0gY2xhc3MgRXhwb3J0RGVjbGFyYXRpb24gZXh0ZW5kcyBNb2R1bGVEZWNsYXJhdGlvblxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgQGNoZWNrU2NvcGUgbywgJ2V4cG9ydCdcblxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIiN7QHRhYn1leHBvcnQgXCJcbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAnZGVmYXVsdCAnIGlmIEAgaW5zdGFuY2VvZiBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb25cblxuICAgICAgICBpZiBAIG5vdCBpbnN0YW5jZW9mIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiBhbmRcbiAgICAgICAgICAgICAoQGNsYXVzZSBpbnN0YW5jZW9mIEFzc2lnbiBvciBAY2xhdXNlIGluc3RhbmNlb2YgQ2xhc3MpXG4gICAgICAgICAgICAjIFByZXZlbnQgZXhwb3J0aW5nIGFuIGFub255bW91cyBjbGFzczsgYWxsIGV4cG9ydGVkIG1lbWJlcnMgbXVzdCBiZSBuYW1lZFxuICAgICAgICAgICAgaWYgQGNsYXVzZSBpbnN0YW5jZW9mIENsYXNzIGFuZCBub3QgQGNsYXVzZS52YXJpYWJsZVxuICAgICAgICAgICAgICAgIEBjbGF1c2UuZXJyb3IgJ2Fub255bW91cyBjbGFzc2VzIGNhbm5vdCBiZSBleHBvcnRlZCdcblxuICAgICAgICAgICAgIyBXaGVuIHRoZSBFUzIwMTUgYGNsYXNzYCBrZXl3b3JkIGlzIHN1cHBvcnRlZCwgZG9u4oCZdCBhZGQgYSBgdmFyYCBoZXJlXG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICd2YXIgJ1xuICAgICAgICAgICAgQGNsYXVzZS5tb2R1bGVEZWNsYXJhdGlvbiA9ICdleHBvcnQnXG5cbiAgICAgICAgaWYgQGNsYXVzZS5ib2R5PyBhbmQgQGNsYXVzZS5ib2R5IGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgICAgIGNvZGUgPSBjb2RlLmNvbmNhdCBAY2xhdXNlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29kZSA9IGNvZGUuY29uY2F0IEBjbGF1c2UuY29tcGlsZU5vZGUgb1xuXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCIgZnJvbSAje0Bzb3VyY2UudmFsdWV9XCIgaWYgQHNvdXJjZT8udmFsdWU/XG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJzsnXG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5FeHBvcnROYW1lZERlY2xhcmF0aW9uID0gY2xhc3MgRXhwb3J0TmFtZWREZWNsYXJhdGlvbiBleHRlbmRzIEV4cG9ydERlY2xhcmF0aW9uXG5cbmV4cG9ydHMuRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uID0gY2xhc3MgRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uIGV4dGVuZHMgRXhwb3J0RGVjbGFyYXRpb25cblxuZXhwb3J0cy5FeHBvcnRBbGxEZWNsYXJhdGlvbiA9IGNsYXNzIEV4cG9ydEFsbERlY2xhcmF0aW9uIGV4dGVuZHMgRXhwb3J0RGVjbGFyYXRpb25cblxuZXhwb3J0cy5Nb2R1bGVTcGVjaWZpZXJMaXN0ID0gY2xhc3MgTW9kdWxlU3BlY2lmaWVyTGlzdCBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQHNwZWNpZmllcnMpIC0+XG5cbiAgICBjaGlsZHJlbjogWydzcGVjaWZpZXJzJ11cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgY29kZSA9IFtdXG4gICAgICAgIG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBjb21waWxlZExpc3QgPSAoc3BlY2lmaWVyLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUIGZvciBzcGVjaWZpZXIgaW4gQHNwZWNpZmllcnMpXG5cbiAgICAgICAgaWYgQHNwZWNpZmllcnMubGVuZ3RoICE9IDBcbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCJ7XFxuI3tvLmluZGVudH1cIlxuICAgICAgICAgICAgZm9yIGZyYWdtZW50cywgaW5kZXggaW4gY29tcGlsZWRMaXN0XG4gICAgICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZShcIixcXG4je28uaW5kZW50fVwiKSBpZiBpbmRleFxuICAgICAgICAgICAgICAgIGNvZGUucHVzaCBmcmFnbWVudHMuLi5cbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCJcXG59XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAne30nXG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRTcGVjaWZpZXJMaXN0ID0gY2xhc3MgSW1wb3J0U3BlY2lmaWVyTGlzdCBleHRlbmRzIE1vZHVsZVNwZWNpZmllckxpc3RcblxuZXhwb3J0cy5FeHBvcnRTcGVjaWZpZXJMaXN0ID0gY2xhc3MgRXhwb3J0U3BlY2lmaWVyTGlzdCBleHRlbmRzIE1vZHVsZVNwZWNpZmllckxpc3RcblxuZXhwb3J0cy5Nb2R1bGVTcGVjaWZpZXIgPSBjbGFzcyBNb2R1bGVTcGVjaWZpZXIgZXh0ZW5kcyBCYXNlXG4gICAgQDogKEBvcmlnaW5hbCwgQGFsaWFzLCBAbW9kdWxlRGVjbGFyYXRpb25UeXBlKSAtPlxuICAgICAgICAjIFRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZSBlbnRlcmluZyB0aGUgbG9jYWwgc2NvcGVcbiAgICAgICAgQGlkZW50aWZpZXIgPSBpZiBAYWxpYXM/IHRoZW4gQGFsaWFzLnZhbHVlIGVsc2UgQG9yaWdpbmFsLnZhbHVlXG5cbiAgICBjaGlsZHJlbjogWydvcmlnaW5hbCcsICdhbGlhcyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIG8uc2NvcGUuZmluZCBAaWRlbnRpZmllciwgQG1vZHVsZURlY2xhcmF0aW9uVHlwZVxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBAb3JpZ2luYWwudmFsdWVcbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIiBhcyAje0BhbGlhcy52YWx1ZX1cIiBpZiBAYWxpYXM/XG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRTcGVjaWZpZXIgPSBjbGFzcyBJbXBvcnRTcGVjaWZpZXIgZXh0ZW5kcyBNb2R1bGVTcGVjaWZpZXJcbiAgICBAOiAoaW1wb3J0ZWQsIGxvY2FsKSAtPlxuICAgICAgICBzdXBlciBpbXBvcnRlZCwgbG9jYWwsICdpbXBvcnQnXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgICMgUGVyIHRoZSBzcGVjLCBzeW1ib2xzIGNhbuKAmXQgYmUgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgICAgIyAoZS5nLiBgaW1wb3J0IHsgZm9vLCBmb28gfSBmcm9tICdsaWInYCBpcyBpbnZhbGlkKVxuICAgICAgICBpZiBAaWRlbnRpZmllciBpbiBvLmltcG9ydGVkU3ltYm9scyBvciBvLnNjb3BlLmNoZWNrKEBpZGVudGlmaWVyKVxuICAgICAgICAgICAgQGVycm9yIFwiJyN7QGlkZW50aWZpZXJ9JyBoYXMgYWxyZWFkeSBiZWVuIGRlY2xhcmVkXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgby5pbXBvcnRlZFN5bWJvbHMucHVzaCBAaWRlbnRpZmllclxuICAgICAgICBzdXBlciBvXG5cbmV4cG9ydHMuSW1wb3J0RGVmYXVsdFNwZWNpZmllciA9IGNsYXNzIEltcG9ydERlZmF1bHRTcGVjaWZpZXIgZXh0ZW5kcyBJbXBvcnRTcGVjaWZpZXJcblxuZXhwb3J0cy5JbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgPSBjbGFzcyBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgZXh0ZW5kcyBJbXBvcnRTcGVjaWZpZXJcblxuZXhwb3J0cy5FeHBvcnRTcGVjaWZpZXIgPSBjbGFzcyBFeHBvcnRTcGVjaWZpZXIgZXh0ZW5kcyBNb2R1bGVTcGVjaWZpZXJcbiAgICBAOiAobG9jYWwsIGV4cG9ydGVkKSAtPlxuICAgICAgICBzdXBlciBsb2NhbCwgZXhwb3J0ZWQsICdleHBvcnQnXG5cbiMgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbiMgVGhlICoqQXNzaWduKiogaXMgdXNlZCB0byBhc3NpZ24gYSBsb2NhbCB2YXJpYWJsZSB0byB2YWx1ZSwgb3IgdG8gc2V0IHRoZVxuIyBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgLS0gaW5jbHVkaW5nIHdpdGhpbiBvYmplY3QgbGl0ZXJhbHMuXG5cbmV4cG9ydHMuQXNzaWduID0gY2xhc3MgQXNzaWduIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAdmFyaWFibGUsIEB2YWx1ZSwgQGNvbnRleHQsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAge0BwYXJhbSwgQHN1YnBhdHRlcm4sIEBvcGVyYXRvclRva2VuLCBAbW9kdWxlRGVjbGFyYXRpb259ID0gb3B0aW9uc1xuXG4gICAgY2hpbGRyZW46IFsndmFyaWFibGUnLCAndmFsdWUnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAtPlxuICAgICAgICBvPy5sZXZlbCBpcyBMRVZFTF9UT1AgYW5kIEBjb250ZXh0PyBhbmQgKEBtb2R1bGVEZWNsYXJhdGlvbiBvciBcIj9cIiBpbiBAY29udGV4dClcblxuICAgIGNoZWNrQXNzaWduYWJpbGl0eTogKG8sIHZhckJhc2UpIC0+XG4gICAgICAgIGlmIE9iamVjdDo6aGFzT3duUHJvcGVydHkuY2FsbChvLnNjb3BlLnBvc2l0aW9ucywgdmFyQmFzZS52YWx1ZSkgYW5kXG4gICAgICAgICAgICAgby5zY29wZS52YXJpYWJsZXNbby5zY29wZS5wb3NpdGlvbnNbdmFyQmFzZS52YWx1ZV1dLnR5cGUgaXMgJ2ltcG9ydCdcbiAgICAgICAgICAgIHZhckJhc2UuZXJyb3IgXCInI3t2YXJCYXNlLnZhbHVlfScgaXMgcmVhZC1vbmx5XCJcblxuICAgIGFzc2lnbnM6IChuYW1lKSAtPlxuICAgICAgICBAW2lmIEBjb250ZXh0IGlzICdvYmplY3QnIHRoZW4gJ3ZhbHVlJyBlbHNlICd2YXJpYWJsZSddLmFzc2lnbnMgbmFtZVxuXG4gICAgdW5mb2xkU29hazogKG8pIC0+XG4gICAgICAgIHVuZm9sZFNvYWsgbywgdGhpcywgJ3ZhcmlhYmxlJ1xuXG4gICAgIyBDb21waWxlIGFuIGFzc2lnbm1lbnQsIGRlbGVnYXRpbmcgdG8gYGNvbXBpbGVQYXR0ZXJuTWF0Y2hgIG9yXG4gICAgIyBgY29tcGlsZVNwbGljZWAgaWYgYXBwcm9wcmlhdGUuIEtlZXAgdHJhY2sgb2YgdGhlIG5hbWUgb2YgdGhlIGJhc2Ugb2JqZWN0XG4gICAgIyB3ZSd2ZSBiZWVuIGFzc2lnbmVkIHRvLCBmb3IgY29ycmVjdCBpbnRlcm5hbCByZWZlcmVuY2VzLiBJZiB0aGUgdmFyaWFibGVcbiAgICAjIGhhcyBub3QgYmVlbiBzZWVuIHlldCB3aXRoaW4gdGhlIGN1cnJlbnQgc2NvcGUsIGRlY2xhcmUgaXQuXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgaXNWYWx1ZSA9IEB2YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgICAgICByZXR1cm4gQGNvbXBpbGVQYXR0ZXJuTWF0Y2ggbyBpZiBAdmFyaWFibGUuaXNBcnJheSgpIG9yIEB2YXJpYWJsZS5pc09iamVjdCgpXG4gICAgICAgICAgICByZXR1cm4gQGNvbXBpbGVTcGxpY2UgICAgICAgbyBpZiBAdmFyaWFibGUuaXNTcGxpY2UoKVxuICAgICAgICAgICAgcmV0dXJuIEBjb21waWxlQ29uZGl0aW9uYWwgIG8gaWYgQGNvbnRleHQgaW4gWyd8fD0nLCAnJiY9JywgJz89J11cbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVNwZWNpYWxNYXRoICBvIGlmIEBjb250ZXh0IGluIFsnKio9JywgJy8vPScsICclJT0nXVxuICAgICAgICBpZiBAdmFsdWUgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICBpZiBAdmFsdWUuc3RhdGljXG4gICAgICAgICAgICAgICAgQHZhbHVlLmtsYXNzID0gQHZhcmlhYmxlLmJhc2VcbiAgICAgICAgICAgICAgICBAdmFsdWUubmFtZSAgPSBAdmFyaWFibGUucHJvcGVydGllc1swXVxuICAgICAgICAgICAgICAgIEB2YWx1ZS52YXJpYWJsZSA9IEB2YXJpYWJsZVxuICAgICAgICAgICAgZWxzZSBpZiBAdmFyaWFibGUucHJvcGVydGllcz8ubGVuZ3RoID49IDJcbiAgICAgICAgICAgICAgICBbcHJvcGVydGllcy4uLiwgcHJvdG90eXBlLCBuYW1lXSA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgaWYgcHJvdG90eXBlLm5hbWU/LnZhbHVlIGlzICdwcm90b3R5cGUnXG4gICAgICAgICAgICAgICAgICAgIEB2YWx1ZS5rbGFzcyA9IG5ldyBWYWx1ZSBAdmFyaWFibGUuYmFzZSwgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgICAgICBAdmFsdWUubmFtZSAgPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgIEB2YWx1ZS52YXJpYWJsZSA9IEB2YXJpYWJsZVxuICAgICAgICB1bmxlc3MgQGNvbnRleHRcbiAgICAgICAgICAgIHZhckJhc2UgPSBAdmFyaWFibGUudW53cmFwQWxsKClcbiAgICAgICAgICAgIHVubGVzcyB2YXJCYXNlLmlzQXNzaWduYWJsZSgpXG4gICAgICAgICAgICAgICAgQHZhcmlhYmxlLmVycm9yIFwiJyN7QHZhcmlhYmxlLmNvbXBpbGUgb30nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICAgICAgICAgIHVubGVzcyB2YXJCYXNlLmhhc1Byb3BlcnRpZXM/KClcbiAgICAgICAgICAgICAgICAjIGBtb2R1bGVEZWNsYXJhdGlvbmAgY2FuIGJlIGAnaW1wb3J0J2Agb3IgYCdleHBvcnQnYFxuICAgICAgICAgICAgICAgIGlmIEBtb2R1bGVEZWNsYXJhdGlvblxuICAgICAgICAgICAgICAgICAgICBAY2hlY2tBc3NpZ25hYmlsaXR5IG8sIHZhckJhc2VcbiAgICAgICAgICAgICAgICAgICAgby5zY29wZS5hZGQgdmFyQmFzZS52YWx1ZSwgQG1vZHVsZURlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAcGFyYW1cbiAgICAgICAgICAgICAgICAgICAgby5zY29wZS5hZGQgdmFyQmFzZS52YWx1ZSwgJ3ZhcidcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBjaGVja0Fzc2lnbmFiaWxpdHkgbywgdmFyQmFzZVxuICAgICAgICAgICAgICAgICAgICBvLnNjb3BlLmZpbmQgdmFyQmFzZS52YWx1ZVxuXG4gICAgICAgIHZhbCA9IEB2YWx1ZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICBAdmFyaWFibGUuZnJvbnQgPSB0cnVlIGlmIGlzVmFsdWUgYW5kIEB2YXJpYWJsZS5iYXNlIGluc3RhbmNlb2YgT2JqXG4gICAgICAgIGNvbXBpbGVkTmFtZSA9IEB2YXJpYWJsZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuXG4gICAgICAgIGlmIEBjb250ZXh0IGlzICdvYmplY3QnXG4gICAgICAgICAgICBpZiBAZnJhZ21lbnRzVG9UZXh0KGNvbXBpbGVkTmFtZSkgaW4gSlNfRk9SQklEREVOXG4gICAgICAgICAgICAgICAgY29tcGlsZWROYW1lLnVuc2hpZnQgQG1ha2VDb2RlICdcIidcbiAgICAgICAgICAgICAgICBjb21waWxlZE5hbWUucHVzaCBAbWFrZUNvZGUgJ1wiJ1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBpbGVkTmFtZS5jb25jYXQgQG1ha2VDb2RlKFwiOiBcIiksIHZhbFxuXG4gICAgICAgIGFuc3dlciA9IGNvbXBpbGVkTmFtZS5jb25jYXQgQG1ha2VDb2RlKFwiICN7IEBjb250ZXh0IG9yICc9JyB9IFwiKSwgdmFsXG4gICAgICAgIGlmIG8ubGV2ZWwgPD0gTEVWRUxfTElTVCB0aGVuIGFuc3dlciBlbHNlIEB3cmFwSW5CcmFjZXMgYW5zd2VyXG5cbiAgICAjIEJyaWVmIGltcGxlbWVudGF0aW9uIG9mIHJlY3Vyc2l2ZSBwYXR0ZXJuIG1hdGNoaW5nLCB3aGVuIGFzc2lnbmluZyBhcnJheSBvclxuICAgICMgb2JqZWN0IGxpdGVyYWxzIHRvIGEgdmFsdWUuIFBlZWtzIGF0IHRoZWlyIHByb3BlcnRpZXMgdG8gYXNzaWduIGlubmVyIG5hbWVzLlxuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNvbXBpbGVQYXR0ZXJuTWF0Y2g6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgdG9wICAgICAgID0gby5sZXZlbCBpcyBMRVZFTF9UT1BcbiAgICAgICAge3ZhbHVlfSAgID0gdGhpc1xuICAgICAgICB7b2JqZWN0c30gPSBAdmFyaWFibGUuYmFzZVxuICAgICAgICBcbiAgICAgICAgdW5sZXNzIG9sZW4gPSBvYmplY3RzLmxlbmd0aFxuICAgICAgICAgICAgY29kZSA9IHZhbHVlLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgICAgICByZXR1cm4gaWYgby5sZXZlbCA+PSBMRVZFTF9PUCB0aGVuIEB3cmFwSW5CcmFjZXMgY29kZSBlbHNlIGNvZGVcbiAgICAgICAgICAgIFxuICAgICAgICBbb2JqXSA9IG9iamVjdHNcbiAgICAgICAgXG4gICAgICAgIGlmIG9sZW4gaXMgMSBhbmQgb2JqIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICBvYmouZXJyb3IgJ0Rlc3RydWN0dXJpbmcgYXNzaWdubWVudCBoYXMgbm8gdGFyZ2V0J1xuICAgICAgICAgICAgXG4gICAgICAgIGlzT2JqZWN0ID0gQHZhcmlhYmxlLmlzT2JqZWN0KClcbiAgICAgICAgXG4gICAgICAgIGlmIHRvcCBhbmQgb2xlbiBpcyAxIGFuZCBvYmogbm90IGluc3RhbmNlb2YgU3BsYXRcbiAgICAgICAgICAgICMgUGljayB0aGUgcHJvcGVydHkgc3RyYWlnaHQgb2ZmIHRoZSB2YWx1ZSB3aGVuIHRoZXJl4oCZcyBqdXN0IG9uZSB0byBwaWNrXG4gICAgICAgICAgICAjIChubyBuZWVkIHRvIGNhY2hlIHRoZSB2YWx1ZSBpbnRvIGEgdmFyaWFibGUpLlxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gbnVsbFxuICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduIGFuZCBvYmouY29udGV4dCBpcyAnb2JqZWN0J1xuICAgICAgICAgICAgICAgICMgQSByZWd1bGFyIG9iamVjdCBwYXR0ZXJuLW1hdGNoLlxuICAgICAgICAgICAgICAgIHt2YXJpYWJsZToge2Jhc2U6IGlkeH0sIHZhbHVlOiBvYmp9ID0gb2JqXG4gICAgICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IG9iai52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBvYmogPSBvYmoudmFyaWFibGVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gb2JqLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YXJpYWJsZVxuICAgICAgICAgICAgICAgIGlkeCA9IGlmIGlzT2JqZWN0ICMgQSBzaG9ydGhhbmQgYHthLCBiLCBAY30gPSB2YWxgIHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIGlmIG9iai50aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmoucHJvcGVydGllc1swXS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBQcm9wZXJ0eU5hbWUgb2JqLnVud3JhcCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAjIEEgcmVndWxhciBhcnJheSBwYXR0ZXJuLW1hdGNoLlxuICAgICAgICAgICAgICAgICAgICBuZXcgTnVtYmVyTGl0ZXJhbCAwXG4gICAgICAgICAgICBhY2MgPSBpZHgudW53cmFwKCkgaW5zdGFuY2VvZiBQcm9wZXJ0eU5hbWVcbiAgICAgICAgICAgIHZhbHVlID0gbmV3IFZhbHVlIHZhbHVlXG4gICAgICAgICAgICB2YWx1ZS5wcm9wZXJ0aWVzLnB1c2ggbmV3IChpZiBhY2MgdGhlbiBBY2Nlc3MgZWxzZSBJbmRleCkgaWR4XG4gICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgb2JqLnVud3JhcCgpLnZhbHVlXG4gICAgICAgICAgICBvYmouZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgICAgICB2YWx1ZSA9IG5ldyBPcCAnPycsIHZhbHVlLCBkZWZhdWx0VmFsdWUgaWYgZGVmYXVsdFZhbHVlXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFzc2lnbihvYmosIHZhbHVlLCBudWxsLCBwYXJhbTogQHBhcmFtKS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QXG4gICAgICAgICAgICBcbiAgICAgICAgdnZhciAgICAgPSB2YWx1ZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICB2dmFyVGV4dCA9IEBmcmFnbWVudHNUb1RleHQgdnZhclxuICAgICAgICBhc3NpZ25zICA9IFtdXG4gICAgICAgIGV4cGFuZGVkSWR4ID0gZmFsc2VcbiAgICAgICAgIyBNYWtlIHZ2YXIgaW50byBhIHNpbXBsZSB2YXJpYWJsZSBpZiBpdCBpc24ndCBhbHJlYWR5LlxuICAgICAgICBpZiB2YWx1ZS51bndyYXAoKSBub3QgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCBvciBAdmFyaWFibGUuYXNzaWducyh2dmFyVGV4dClcbiAgICAgICAgICAgIGFzc2lnbnMucHVzaCBbQG1ha2VDb2RlKFwiI3sgcmVmID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ3JlZicgfSA9IFwiKSwgdnZhci4uLl1cbiAgICAgICAgICAgIHZ2YXIgPSBbQG1ha2VDb2RlIHJlZl1cbiAgICAgICAgICAgIHZ2YXJUZXh0ID0gcmVmXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIG9iaiwgaSBpbiBvYmplY3RzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkeCA9IGlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbm90IGV4cGFuZGVkSWR4IGFuZCBvYmogaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hbWUgPSBvYmoubmFtZS51bndyYXAoKS52YWx1ZVxuICAgICAgICAgICAgICAgIG9iaiA9IG9iai51bndyYXAoKVxuICAgICAgICAgICAgICAgIHZhbCA9IFwiI3tvbGVufSA8PSAje3Z2YXJUZXh0fS5sZW5ndGggPyAjeyB1dGlsaXR5ICdzbGljZScsIG8gfS5jYWxsKCN7dnZhclRleHR9LCAje2l9XCJcbiAgICAgICAgICAgICAgICBpZiByZXN0ID0gb2xlbiAtIGkgLSAxXG4gICAgICAgICAgICAgICAgICAgIGl2YXIgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnaScsIHNpbmdsZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB2YWwgKz0gXCIsICN7aXZhcn0gPSAje3Z2YXJUZXh0fS5sZW5ndGggLSAje3Jlc3R9KSA6ICgje2l2YXJ9ID0gI3tpfSwgW10pXCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHZhbCArPSBcIikgOiBbXVwiXG4gICAgICAgICAgICAgICAgdmFsICAgICA9IG5ldyBMaXRlcmFsIHZhbFxuICAgICAgICAgICAgICAgIGV4cGFuZGVkSWR4ID0gXCIje2l2YXJ9KytcIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZSBpZiBub3QgZXhwYW5kZWRJZHggYW5kIG9iaiBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHJlc3QgPSBvbGVuIC0gaSAtIDFcbiAgICAgICAgICAgICAgICAgICAgaWYgcmVzdCBpcyAxXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBhbmRlZElkeCA9IFwiI3t2dmFyVGV4dH0ubGVuZ3RoIC0gMVwiXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGl2YXIgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnaScsIHNpbmdsZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gbmV3IExpdGVyYWwgXCIje2l2YXJ9ID0gI3t2dmFyVGV4dH0ubGVuZ3RoIC0gI3tyZXN0fVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBhbmRlZElkeCA9IFwiI3tpdmFyfSsrXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbnMucHVzaCB2YWwuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1RcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIFNwbGF0IG9yIG9iaiBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgICAgICAgICBvYmouZXJyb3IgXCJtdWx0aXBsZSBzcGxhdHMvZXhwYW5zaW9ucyBhcmUgZGlzYWxsb3dlZCBpbiBhbiBhc3NpZ25tZW50XCJcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBudWxsXG4gICAgICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduIGFuZCBvYmouY29udGV4dCBpcyAnb2JqZWN0JyAjIEEgcmVndWxhciBvYmplY3QgcGF0dGVybi1tYXRjaC5cbiAgICAgICAgICAgICAgICAgICAge3ZhcmlhYmxlOiB7YmFzZTogaWR4fSwgdmFsdWU6IG9ian0gPSBvYmpcbiAgICAgICAgICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBvYmoudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YXJpYWJsZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgb2JqIGluc3RhbmNlb2YgQXNzaWduXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBvYmoudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YXJpYWJsZVxuICAgICAgICAgICAgICAgICAgICBpZHggPSBpZiBpc09iamVjdCAjIEEgc2hvcnRoYW5kIGB7YSwgYiwgQGN9ID0gdmFsYCBwYXR0ZXJuLW1hdGNoLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgb2JqLnRoaXMgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqLnByb3BlcnRpZXNbMF0ubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBQcm9wZXJ0eU5hbWUgb2JqLnVud3JhcCgpLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgIyBBIHJlZ3VsYXIgYXJyYXkgcGF0dGVybi1tYXRjaC5cbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBMaXRlcmFsIGV4cGFuZGVkSWR4IG9yIGlkeFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmFtZSA9IG9iai51bndyYXAoKS52YWx1ZVxuICAgICAgICAgICAgICAgIGFjYyA9IGlkeC51bndyYXAoKSBpbnN0YW5jZW9mIFByb3BlcnR5TmFtZVxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBWYWx1ZSBuZXcgTGl0ZXJhbCh2dmFyVGV4dCksIFtuZXcgKGlmIGFjYyB0aGVuIEFjY2VzcyBlbHNlIEluZGV4KSBpZHhdXG4gICAgICAgICAgICAgICAgdmFsID0gbmV3IE9wICc/JywgdmFsLCBkZWZhdWx0VmFsdWUgaWYgZGVmYXVsdFZhbHVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBuYW1lP1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBuYW1lXG4gICAgICAgICAgICAgICAgb2JqLmVycm9yIG1lc3NhZ2UgaWYgbWVzc2FnZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhc3NpZ25zLnB1c2ggbmV3IEFzc2lnbihvYmosIHZhbCwgbnVsbCwgcGFyYW06IEBwYXJhbSwgc3VicGF0dGVybjogeWVzKS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICAgICAgXG4gICAgICAgIGFzc2lnbnMucHVzaCB2dmFyIHVubGVzcyB0b3Agb3IgQHN1YnBhdHRlcm5cbiAgICAgICAgZnJhZ21lbnRzID0gQGpvaW5GcmFnbWVudEFycmF5cyBhc3NpZ25zLCAnLCAnXG4gICAgICAgIGlmIG8ubGV2ZWwgPCBMRVZFTF9MSVNUIHRoZW4gZnJhZ21lbnRzIGVsc2UgQHdyYXBJbkJyYWNlcyBmcmFnbWVudHNcblxuICAgICMgV2hlbiBjb21waWxpbmcgYSBjb25kaXRpb25hbCBhc3NpZ25tZW50LCB0YWtlIGNhcmUgdG8gZW5zdXJlIHRoYXQgdGhlXG4gICAgIyBvcGVyYW5kcyBhcmUgb25seSBldmFsdWF0ZWQgb25jZSwgZXZlbiB0aG91Z2ggd2UgaGF2ZSB0byByZWZlcmVuY2UgdGhlbSBtb3JlIHRoYW4gb25jZS5cbiAgICBcbiAgICBjb21waWxlQ29uZGl0aW9uYWw6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgW2xlZnQsIHJpZ2h0XSA9IEB2YXJpYWJsZS5jYWNoZVJlZmVyZW5jZSBvXG4gICAgICAgICMgRGlzYWxsb3cgY29uZGl0aW9uYWwgYXNzaWdubWVudCBvZiB1bmRlZmluZWQgdmFyaWFibGVzLlxuICAgICAgICBpZiBub3QgbGVmdC5wcm9wZXJ0aWVzLmxlbmd0aCBhbmQgbGVmdC5iYXNlIGluc3RhbmNlb2YgTGl0ZXJhbCBhbmRcbiAgICAgICAgICAgICAgICAgICAgIGxlZnQuYmFzZSBub3QgaW5zdGFuY2VvZiBUaGlzTGl0ZXJhbCBhbmQgbm90IG8uc2NvcGUuY2hlY2sgbGVmdC5iYXNlLnZhbHVlXG4gICAgICAgICAgICBAdmFyaWFibGUuZXJyb3IgXCJ0aGUgdmFyaWFibGUgXFxcIiN7bGVmdC5iYXNlLnZhbHVlfVxcXCIgY2FuJ3QgYmUgYXNzaWduZWQgd2l0aCAje0Bjb250ZXh0fSBiZWNhdXNlIGl0IGhhcyBub3QgYmVlbiBkZWNsYXJlZCBiZWZvcmVcIlxuICAgICAgICBpZiBcIj9cIiBpbiBAY29udGV4dFxuICAgICAgICAgICAgby5pc0V4aXN0ZW50aWFsRXF1YWxzID0gdHJ1ZVxuICAgICAgICAgICAgbmV3IElmKG5ldyBFeGlzdGVuY2UobGVmdCksIHJpZ2h0LCB0eXBlOiAnaWYnKS5hZGRFbHNlKG5ldyBBc3NpZ24ocmlnaHQsIEB2YWx1ZSwgJz0nKSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJhZ21lbnRzID0gbmV3IE9wKEBjb250ZXh0Wy4uLi0xXSwgbGVmdCwgbmV3IEFzc2lnbihyaWdodCwgQHZhbHVlLCAnPScpKS5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICAgICAgaWYgby5sZXZlbCA8PSBMRVZFTF9MSVNUIHRoZW4gZnJhZ21lbnRzIGVsc2UgQHdyYXBJbkJyYWNlcyBmcmFnbWVudHNcblxuICAgICMgQ29udmVydCBzcGVjaWFsIG1hdGggYXNzaWdubWVudCBvcGVyYXRvcnMgbGlrZSBgYSAqKj0gYmAgdG8gdGhlIGVxdWl2YWxlbnRcbiAgICAjIGV4dGVuZGVkIGZvcm0gYGEgPSBhICoqIGJgIGFuZCB0aGVuIGNvbXBpbGVzIHRoYXQuXG4gICAgXG4gICAgY29tcGlsZVNwZWNpYWxNYXRoOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIFtsZWZ0LCByaWdodF0gPSBAdmFyaWFibGUuY2FjaGVSZWZlcmVuY2Ugb1xuICAgICAgICBuZXcgQXNzaWduKGxlZnQsIG5ldyBPcChAY29udGV4dFsuLi4tMV0sIHJpZ2h0LCBAdmFsdWUpKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgIyBDb21waWxlIHRoZSBhc3NpZ25tZW50IGZyb20gYW4gYXJyYXkgc3BsaWNlIGxpdGVyYWwsIHVzaW5nIEphdmFTY3JpcHQncyBgQXJyYXkjc3BsaWNlYCBtZXRob2QuXG4gICAgXG4gICAgY29tcGlsZVNwbGljZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICB7cmFuZ2U6IHtmcm9tLCB0bywgZXhjbHVzaXZlfX0gPSBAdmFyaWFibGUucHJvcGVydGllcy5wb3AoKVxuICAgICAgICBuYW1lID0gQHZhcmlhYmxlLmNvbXBpbGUgb1xuICAgICAgICBpZiBmcm9tXG4gICAgICAgICAgICBbZnJvbURlY2wsIGZyb21SZWZdID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIGZyb20uY2FjaGUgbywgTEVWRUxfT1BcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnJvbURlY2wgPSBmcm9tUmVmID0gJzAnXG4gICAgICAgIGlmIHRvXG4gICAgICAgICAgICBpZiBmcm9tPy5pc051bWJlcigpIGFuZCB0by5pc051bWJlcigpXG4gICAgICAgICAgICAgICAgdG8gPSB0by5jb21waWxlKG8pIC0gZnJvbVJlZlxuICAgICAgICAgICAgICAgIHRvICs9IDEgdW5sZXNzIGV4Y2x1c2l2ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRvID0gdG8uY29tcGlsZShvLCBMRVZFTF9BQ0NFU1MpICsgJyAtICcgKyBmcm9tUmVmXG4gICAgICAgICAgICAgICAgdG8gKz0gJyArIDEnIHVubGVzcyBleGNsdXNpdmVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdG8gPSBcIjllOVwiXG4gICAgICAgIFt2YWxEZWYsIHZhbFJlZl0gPSBAdmFsdWUuY2FjaGUgbywgTEVWRUxfTElTVFxuICAgICAgICBhbnN3ZXIgPSBbXS5jb25jYXQgQG1ha2VDb2RlKFwiW10uc3BsaWNlLmFwcGx5KCN7bmFtZX0sIFsje2Zyb21EZWNsfSwgI3t0b31dLmNvbmNhdChcIiksIHZhbERlZiwgQG1ha2VDb2RlKFwiKSksIFwiKSwgdmFsUmVmXG4gICAgICAgIGlmIG8ubGV2ZWwgPiBMRVZFTF9UT1AgdGhlbiBAd3JhcEluQnJhY2VzIGFuc3dlciBlbHNlIGFuc3dlclxuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICBcblxuIyBBIGZ1bmN0aW9uIGRlZmluaXRpb24uIFRoaXMgaXMgdGhlIG9ubHkgbm9kZSB0aGF0IGNyZWF0ZXMgYSBuZXcgU2NvcGUuXG4jIFdoZW4gZm9yIHRoZSBwdXJwb3NlcyBvZiB3YWxraW5nIHRoZSBjb250ZW50cyBvZiBhIGZ1bmN0aW9uIGJvZHksIHRoZSBDb2RlIGhhcyBubyAqY2hpbGRyZW4qIC0tIHRoZXkncmUgd2l0aGluIHRoZSBpbm5lciBzY29wZS5cblxuZXhwb3J0cy5Db2RlID0gY2xhc3MgQ29kZSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAocGFyYW1zLCBib2R5LCB0YWcpIC0+XG4gICAgICAgIEBwYXJhbXMgPSBwYXJhbXMgb3IgW11cbiAgICAgICAgQGJvZHkgICA9IGJvZHkgb3IgbmV3IEJsb2NrXG4gICAgICAgIEBib3VuZCAgPSB0YWcgaXMgJ2JvdW5kZnVuYydcbiAgICAgICAgQGlzR2VuZXJhdG9yID0gISFAYm9keS5jb250YWlucyAobm9kZSkgLT5cbiAgICAgICAgICAgIChub2RlIGluc3RhbmNlb2YgT3AgYW5kIG5vZGUuaXNZaWVsZCgpKSBvciBub2RlIGluc3RhbmNlb2YgWWllbGRSZXR1cm5cblxuICAgIGNoaWxkcmVuOiBbJ3BhcmFtcycsICdib2R5J11cblxuICAgIGlzU3RhdGVtZW50OiAtPiAhIUBjdG9yXG5cbiAgICBqdW1wczogTk9cblxuICAgIG1ha2VTY29wZTogKHBhcmVudFNjb3BlKSAtPiBuZXcgU2NvcGUgcGFyZW50U2NvcGUsIEBib2R5LCB0aGlzXG5cbiAgICAjIENvbXBpbGF0aW9uIGNyZWF0ZXMgYSBuZXcgc2NvcGUgdW5sZXNzIGV4cGxpY2l0bHkgYXNrZWQgdG8gc2hhcmUgd2l0aCB0aGUgb3V0ZXIgc2NvcGUuIFxuICAgICMgSGFuZGxlcyBzcGxhdCBwYXJhbWV0ZXJzIGluIHRoZSBwYXJhbWV0ZXIgbGlzdCBieSBwZWVraW5nIGF0IHRoZSBKYXZhU2NyaXB0IGBhcmd1bWVudHNgIG9iamVjdC4gXG4gICAgIyBJZiB0aGUgZnVuY3Rpb24gaXMgYm91bmQgd2l0aCB0aGUgYD0+YCBhcnJvdywgZ2VuZXJhdGVzIGEgd3JhcHBlciB0aGF0IHNhdmVzIHRoZSBjdXJyZW50IHZhbHVlIG9mIGB0aGlzYCB0aHJvdWdoIGEgY2xvc3VyZS5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG5cbiAgICAgICAgaWYgQGJvdW5kIGFuZCBvLnNjb3BlLm1ldGhvZD8uYm91bmRcbiAgICAgICAgICAgIEBjb250ZXh0ID0gby5zY29wZS5tZXRob2QuY29udGV4dFxuXG4gICAgICAgIGlmIEBib3VuZCBhbmQgbm90IEBjb250ZXh0ICMgSGFuZGxlIGJvdW5kIGZ1bmN0aW9ucyBlYXJseS5cbiAgICAgICAgICAgIEBjb250ZXh0ID0gJ190aGlzJ1xuICAgICAgICAgICAgd3JhcHBlciA9IG5ldyBDb2RlIFtuZXcgUGFyYW0gbmV3IElkZW50aWZpZXJMaXRlcmFsIEBjb250ZXh0XSwgbmV3IEJsb2NrIFt0aGlzXVxuICAgICAgICAgICAgYm91bmRmdW5jID0gbmV3IENhbGwod3JhcHBlciwgW25ldyBUaGlzTGl0ZXJhbF0pXG4gICAgICAgICAgICBib3VuZGZ1bmMudXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nIEBsb2NhdGlvbkRhdGFcbiAgICAgICAgICAgIHJldHVybiBib3VuZGZ1bmMuY29tcGlsZU5vZGUobylcblxuICAgICAgICBvLnNjb3BlICAgICAgICAgPSBkZWwobywgJ2NsYXNzU2NvcGUnKSBvciBAbWFrZVNjb3BlIG8uc2NvcGVcbiAgICAgICAgby5zY29wZS5zaGFyZWQgID0gZGVsKG8sICdzaGFyZWRTY29wZScpXG4gICAgICAgIG8uaW5kZW50ICAgICAgICs9IFRBQlxuICAgICAgICBkZWxldGUgby5iYXJlXG4gICAgICAgIGRlbGV0ZSBvLmlzRXhpc3RlbnRpYWxFcXVhbHNcbiAgICAgICAgcGFyYW1zID0gW11cbiAgICAgICAgZXhwcnMgID0gW11cbiAgICAgICAgZm9yIHBhcmFtIGluIEBwYXJhbXMgd2hlbiBwYXJhbSBub3QgaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgIG8uc2NvcGUucGFyYW1ldGVyIHBhcmFtLmFzUmVmZXJlbmNlIG9cbiAgICAgICAgZm9yIHBhcmFtIGluIEBwYXJhbXMgd2hlbiBwYXJhbS5zcGxhdCBvciBwYXJhbSBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgZm9yIHAgaW4gQHBhcmFtcyB3aGVuIHAgbm90IGluc3RhbmNlb2YgRXhwYW5zaW9uIGFuZCBwLm5hbWUudmFsdWVcbiAgICAgICAgICAgICAgICBvLnNjb3BlLmFkZCBwLm5hbWUudmFsdWUsICd2YXInLCB5ZXNcbiAgICAgICAgICAgIHNwbGF0cyA9IG5ldyBBc3NpZ24gbmV3IFZhbHVlKG5ldyBBcnIocC5hc1JlZmVyZW5jZSBvIGZvciBwIGluIEBwYXJhbXMpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgVmFsdWUgbmV3IElkZW50aWZpZXJMaXRlcmFsICdhcmd1bWVudHMnXG4gICAgICAgICAgICBicmVha1xuICAgICAgICBmb3IgcGFyYW0gaW4gQHBhcmFtc1xuICAgICAgICAgICAgaWYgcGFyYW0uaXNDb21wbGV4KClcbiAgICAgICAgICAgICAgICB2YWwgPSByZWYgPSBwYXJhbS5hc1JlZmVyZW5jZSBvXG4gICAgICAgICAgICAgICAgdmFsID0gbmV3IE9wICc/JywgcmVmLCBwYXJhbS52YWx1ZSBpZiBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgICAgIGV4cHJzLnB1c2ggbmV3IEFzc2lnbiBuZXcgVmFsdWUocGFyYW0ubmFtZSksIHZhbCwgJz0nLCBwYXJhbTogeWVzXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmVmID0gcGFyYW1cbiAgICAgICAgICAgICAgICBpZiBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBsaXQgPSBuZXcgTGl0ZXJhbCByZWYubmFtZS52YWx1ZSArICcgPT0gbnVsbCdcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gbmV3IEFzc2lnbiBuZXcgVmFsdWUocGFyYW0ubmFtZSksIHBhcmFtLnZhbHVlLCAnPSdcbiAgICAgICAgICAgICAgICAgICAgZXhwcnMucHVzaCBuZXcgSWYgbGl0LCB2YWxcbiAgICAgICAgICAgIHBhcmFtcy5wdXNoIHJlZiB1bmxlc3Mgc3BsYXRzXG4gICAgICAgIHdhc0VtcHR5ID0gQGJvZHkuaXNFbXB0eSgpXG4gICAgICAgIGV4cHJzLnVuc2hpZnQgc3BsYXRzIGlmIHNwbGF0c1xuICAgICAgICBAYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IGV4cHJzLi4uIGlmIGV4cHJzLmxlbmd0aFxuICAgICAgICBmb3IgcCwgaSBpbiBwYXJhbXNcbiAgICAgICAgICAgIHBhcmFtc1tpXSA9IHAuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgICAgIG8uc2NvcGUucGFyYW1ldGVyIEBmcmFnbWVudHNUb1RleHQgcGFyYW1zW2ldXG4gICAgICAgIHVuaXFzID0gW11cbiAgICAgICAgXG4gICAgICAgIEBlYWNoUGFyYW1OYW1lIChuYW1lLCBub2RlKSAtPlxuICAgICAgICAgICAgbm9kZS5lcnJvciBcIm11bHRpcGxlIHBhcmFtZXRlcnMgbmFtZWQgI3tuYW1lfVwiIGlmIG5hbWUgaW4gdW5pcXNcbiAgICAgICAgICAgIHVuaXFzLnB1c2ggbmFtZVxuICAgICAgICBcbiAgICAgICAgQGJvZHkubWFrZVJldHVybigpIHVubGVzcyB3YXNFbXB0eSBvciBAbm9SZXR1cm5cbiAgICAgICAgY29kZSA9ICdmdW5jdGlvbidcbiAgICAgICAgY29kZSArPSAnKicgaWYgQGlzR2VuZXJhdG9yXG4gICAgICAgIGNvZGUgKz0gJyAnICsgQG5hbWUgaWYgQGN0b3JcbiAgICAgICAgY29kZSArPSAnKCdcbiAgICAgICAgXG4gICAgICAgIGFuc3dlciA9IFtAbWFrZUNvZGUoY29kZSldXG4gICAgICAgIFxuICAgICAgICBmb3IgcCwgaSBpbiBwYXJhbXNcbiAgICAgICAgICAgIGlmIGkgdGhlbiBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCIsIFwiXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBwLi4uXG4gICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSAnKSB7J1xuICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0KEBtYWtlQ29kZShcIlxcblwiKSwgQGJvZHkuY29tcGlsZVdpdGhEZWNsYXJhdGlvbnMobyksIEBtYWtlQ29kZShcIlxcbiN7QHRhYn1cIikpIHVubGVzcyBAYm9keS5pc0VtcHR5KClcbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlICd9J1xuXG4gICAgICAgIHJldHVybiBbQG1ha2VDb2RlKEB0YWIpLCBhbnN3ZXIuLi5dIGlmIEBjdG9yXG4gICAgICAgIGlmIEBmcm9udCBvciAoby5sZXZlbCA+PSBMRVZFTF9BQ0NFU1MpIHRoZW4gQHdyYXBJbkJyYWNlcyBhbnN3ZXIgZWxzZSBhbnN3ZXJcblxuICAgIGVhY2hQYXJhbU5hbWU6IChpdGVyYXRvcikgLT5cbiAgICAgICAgcGFyYW0uZWFjaE5hbWUgaXRlcmF0b3IgZm9yIHBhcmFtIGluIEBwYXJhbXNcblxuICAgICMgU2hvcnQtY2lyY3VpdCBgdHJhdmVyc2VDaGlsZHJlbmAgbWV0aG9kIHRvIHByZXZlbnQgaXQgZnJvbSBjcm9zc2luZyBzY29wZSBib3VuZGFyaWVzIHVubGVzcyBgY3Jvc3NTY29wZWAgaXMgYHRydWVgLlxuICAgIFxuICAgIHRyYXZlcnNlQ2hpbGRyZW46IChjcm9zc1Njb3BlLCBmdW5jKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXIoY3Jvc3NTY29wZSwgZnVuYykgaWYgY3Jvc3NTY29wZVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuXG4jIEEgcGFyYW1ldGVyIGluIGEgZnVuY3Rpb24gZGVmaW5pdGlvbi4gQmV5b25kIGEgdHlwaWNhbCBKYXZhU2NyaXB0IHBhcmFtZXRlcixcbiMgdGhlc2UgcGFyYW1ldGVycyBjYW4gYWxzbyBhdHRhY2ggdGhlbXNlbHZlcyB0byB0aGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24sXG4jIGFzIHdlbGwgYXMgYmUgYSBzcGxhdCwgZ2F0aGVyaW5nIHVwIGEgZ3JvdXAgb2YgcGFyYW1ldGVycyBpbnRvIGFuIGFycmF5LlxuXG5leHBvcnRzLlBhcmFtID0gY2xhc3MgUGFyYW0gZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBuYW1lLCBAdmFsdWUsIEBzcGxhdCkgLT5cbiAgICAgICAgbWVzc2FnZSA9IGlzVW5hc3NpZ25hYmxlIEBuYW1lLnVud3JhcEFsbCgpLnZhbHVlXG4gICAgICAgIEBuYW1lLmVycm9yIG1lc3NhZ2UgaWYgbWVzc2FnZVxuICAgICAgICAjIHRoZSBmb2xsb3dpbmcgZXJyb3IgZG9lbnMndCB0aHJvdyBhbnltb3JlIGluIGtvZmZlZSAoY29uZmlnIHBhcmFtZXRlcnMpXG4gICAgICAgICMgaWYgQG5hbWUgaW5zdGFuY2VvZiBPYmogYW5kIEBuYW1lLmdlbmVyYXRlZFxuICAgICAgICAgICAgIyB0b2tlbiA9IEBuYW1lLm9iamVjdHNbMF0ub3BlcmF0b3JUb2tlblxuICAgICAgICAgICAgIyB0b2tlbi5lcnJvciBcInVuZXhwZWN0ZWQgI3t0b2tlbi52YWx1ZX1cIlxuXG4gICAgY2hpbGRyZW46IFsnbmFtZScsICd2YWx1ZSddXG5cbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgQG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1RcblxuICAgIGFzUmVmZXJlbmNlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAcmVmZXJlbmNlIGlmIEByZWZlcmVuY2VcbiAgICAgICAgbm9kZSA9IEBuYW1lXG4gICAgICAgIGlmIG5vZGUudGhpc1xuICAgICAgICAgICAgbmFtZSA9IG5vZGUucHJvcGVydGllc1swXS5uYW1lLnZhbHVlXG4gICAgICAgICAgICBuYW1lID0gXCJfI3tuYW1lfVwiIGlmIG5hbWUgaW4gSlNfRk9SQklEREVOXG4gICAgICAgICAgICBub2RlID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlIG5hbWVcbiAgICAgICAgZWxzZSBpZiBub2RlLmlzQ29tcGxleCgpXG4gICAgICAgICAgICBub2RlID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdhcmcnXG4gICAgICAgIG5vZGUgPSBuZXcgVmFsdWUgbm9kZVxuICAgICAgICBub2RlID0gbmV3IFNwbGF0IG5vZGUgaWYgQHNwbGF0XG4gICAgICAgIG5vZGUudXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nIEBsb2NhdGlvbkRhdGFcbiAgICAgICAgQHJlZmVyZW5jZSA9IG5vZGVcblxuICAgIGlzQ29tcGxleDogLT5cbiAgICAgICAgXG4gICAgICAgIEBuYW1lLmlzQ29tcGxleCgpXG5cbiAgICAjIEl0ZXJhdGVzIHRoZSBuYW1lIG9yIG5hbWVzIG9mIGEgYFBhcmFtYC5cbiAgICAjIEluIGEgc2Vuc2UsIGEgZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlciByZXByZXNlbnRzIG11bHRpcGxlIEpTIHBhcmFtZXRlcnMuIFRoaXNcbiAgICAjIG1ldGhvZCBhbGxvd3MgdG8gaXRlcmF0ZSB0aGVtIGFsbC5cbiAgICAjIFRoZSBgaXRlcmF0b3JgIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFzIGBpdGVyYXRvcihuYW1lLCBub2RlKWAgd2hlcmVcbiAgICAjIGBuYW1lYCBpcyB0aGUgbmFtZSBvZiB0aGUgcGFyYW1ldGVyIGFuZCBgbm9kZWAgaXMgdGhlIEFTVCBub2RlIGNvcnJlc3BvbmRpbmcgdG8gdGhhdCBuYW1lLlxuICAgIFxuICAgIGVhY2hOYW1lOiAoaXRlcmF0b3IsIG5hbWUgPSBAbmFtZSktPlxuICAgICAgICBcbiAgICAgICAgYXRQYXJhbSA9IChvYmopIC0+IFxuICAgICAgICAgICAgaXRlcmF0b3IgXCJAI3tvYmoucHJvcGVydGllc1swXS5uYW1lLnZhbHVlfVwiLCBvYmpcbiAgICAgICAgXG4gICAgICAgIGlmIG5hbWUgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgcmV0dXJuIGlmIG5hbWUgaW5zdGFuY2VvZiBOdWxsTGl0ZXJhbFxuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yIG5hbWUudmFsdWUsIG5hbWUgIyBzaW1wbGUgbGl0ZXJhbHMgYGZvb2AsIGBfYCwgZXRjLlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGF0UGFyYW0gbmFtZSBpZiBuYW1lIGluc3RhbmNlb2YgVmFsdWUgIyBhdC1wYXJhbXMgYEBmb29gXG4gICAgICAgIFxuICAgICAgICBmb3Igb2JqIGluIG5hbWUub2JqZWN0cyA/IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnbiBhbmQgbm90IG9iai5jb250ZXh0PyAjIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXIgd2l0aCBkZWZhdWx0IHZhbHVlXG4gICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnbiAjIGFzc2lnbm1lbnRzIHdpdGhpbiBkZXN0cnVjdHVyZWQgcGFyYW1ldGVycyBge2ZvbzpiYXJ9YFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG9iai52YWx1ZSBpbnN0YW5jZW9mIEFzc2lnbiAjIC4uLiBwb3NzaWJseSB3aXRoIGEgZGVmYXVsdCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBvYmogPSBvYmoudmFsdWVcbiAgICAgICAgICAgICAgICBAZWFjaE5hbWUgaXRlcmF0b3IsIG9iai52YWx1ZS51bndyYXAoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIG9iaiBpbnN0YW5jZW9mIFNwbGF0ICMgc3BsYXRzIHdpdGhpbiBkZXN0cnVjdHVyZWQgcGFyYW1ldGVycyBgW3hzLi4uXWBcbiAgICAgICAgICAgICAgICBub2RlID0gb2JqLm5hbWUudW53cmFwKClcbiAgICAgICAgICAgICAgICBpdGVyYXRvciBub2RlLnZhbHVlLCBub2RlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlbHNlIGlmIG9iaiBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgb2JqLmlzQXJyYXkoKSBvciBvYmouaXNPYmplY3QoKSAjIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIHdpdGhpbiBkZXN0cnVjdHVyZWQgcGFyYW1ldGVycyBgW3thfV1gXG4gICAgICAgICAgICAgICAgICAgIEBlYWNoTmFtZSBpdGVyYXRvciwgb2JqLmJhc2VcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG9iai50aGlzICMgYXQtcGFyYW1zIHdpdGhpbiBkZXN0cnVjdHVyZWQgcGFyYW1ldGVycyBge0Bmb299YFxuICAgICAgICAgICAgICAgICAgICBhdFBhcmFtIG9ialxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3Igb2JqLmJhc2UudmFsdWUsIG9iai5iYXNlICMgc2ltcGxlIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIHtmb299XG4gICAgICAgICAgICBlbHNlIGlmIG9iaiBub3QgaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgICAgICBvYmouZXJyb3IgXCJpbGxlZ2FsIHBhcmFtZXRlciAje29iai5jb21waWxlKCl9XCJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICBcbiMgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiMgQSBzcGxhdCwgZWl0aGVyIGFzIGEgcGFyYW1ldGVyIHRvIGEgZnVuY3Rpb24sIGFuIGFyZ3VtZW50IHRvIGEgY2FsbCwgb3IgYXMgcGFydCBvZiBhIGRlc3RydWN0dXJpbmcgYXNzaWdubWVudC5cblxuZXhwb3J0cy5TcGxhdCA9IGNsYXNzIFNwbGF0IGV4dGVuZHMgQmFzZVxuXG4gICAgY2hpbGRyZW46IFsnbmFtZSddXG5cbiAgICBpc0Fzc2lnbmFibGU6IFlFU1xuXG4gICAgQDogKG5hbWUpIC0+XG4gICAgICAgIEBuYW1lID0gaWYgbmFtZS5jb21waWxlIHRoZW4gbmFtZSBlbHNlIG5ldyBMaXRlcmFsIG5hbWVcblxuICAgIGFzc2lnbnM6IChuYW1lKSAtPlxuICAgICAgICBAbmFtZS5hc3NpZ25zIG5hbWVcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgQG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgIHVud3JhcDogLT4gQG5hbWVcblxuICAgICMgVXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNvbnZlcnRzIGFuIGFyYml0cmFyeSBudW1iZXIgb2YgZWxlbWVudHMsIG1peGVkIHdpdGggc3BsYXRzLCB0byBhIHByb3BlciBhcnJheS5cbiAgICBcbiAgICBAY29tcGlsZVNwbGF0dGVkQXJyYXk6IChvLCBsaXN0LCBhcHBseSkgLT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gLTFcbiAgICAgICAgY29udGludWUgd2hpbGUgKG5vZGUgPSBsaXN0WysraW5kZXhdKSBhbmQgbm9kZSBub3QgaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICByZXR1cm4gW10gaWYgaW5kZXggPj0gbGlzdC5sZW5ndGhcbiAgICAgICAgaWYgbGlzdC5sZW5ndGggaXMgMVxuICAgICAgICAgICAgbm9kZSA9IGxpc3RbMF1cbiAgICAgICAgICAgIGZyYWdtZW50cyA9IG5vZGUuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1RcbiAgICAgICAgICAgIHJldHVybiBmcmFnbWVudHMgaWYgYXBwbHlcbiAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgbm9kZS5tYWtlQ29kZShcIiN7IHV0aWxpdHkgJ3NsaWNlJywgbyB9LmNhbGwoXCIpLCBmcmFnbWVudHMsIG5vZGUubWFrZUNvZGUoXCIpXCIpXG4gICAgICAgIGFyZ3MgPSBsaXN0W2luZGV4Li5dXG4gICAgICAgIGZvciBub2RlLCBpIGluIGFyZ3NcbiAgICAgICAgICAgIGNvbXBpbGVkTm9kZSA9IG5vZGUuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1RcbiAgICAgICAgICAgIGFyZ3NbaV0gPSBpZiBub2RlIGluc3RhbmNlb2YgU3BsYXRcbiAgICAgICAgICAgIHRoZW4gW10uY29uY2F0IG5vZGUubWFrZUNvZGUoXCIjeyB1dGlsaXR5ICdzbGljZScsIG8gfS5jYWxsKFwiKSwgY29tcGlsZWROb2RlLCBub2RlLm1ha2VDb2RlKFwiKVwiKVxuICAgICAgICAgICAgZWxzZSBbXS5jb25jYXQgbm9kZS5tYWtlQ29kZShcIltcIiksIGNvbXBpbGVkTm9kZSwgbm9kZS5tYWtlQ29kZShcIl1cIilcbiAgICAgICAgaWYgaW5kZXggaXMgMFxuICAgICAgICAgICAgbm9kZSA9IGxpc3RbMF1cbiAgICAgICAgICAgIGNvbmNhdFBhcnQgPSAobm9kZS5qb2luRnJhZ21lbnRBcnJheXMgYXJnc1sxLi5dLCAnLCAnKVxuICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF0uY29uY2F0IG5vZGUubWFrZUNvZGUoXCIuY29uY2F0KFwiKSwgY29uY2F0UGFydCwgbm9kZS5tYWtlQ29kZShcIilcIilcbiAgICAgICAgYmFzZSA9IChub2RlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUIGZvciBub2RlIGluIGxpc3RbLi4uaW5kZXhdKVxuICAgICAgICBiYXNlID0gbGlzdFswXS5qb2luRnJhZ21lbnRBcnJheXMgYmFzZSwgJywgJ1xuICAgICAgICBjb25jYXRQYXJ0ID0gbGlzdFtpbmRleF0uam9pbkZyYWdtZW50QXJyYXlzIGFyZ3MsICcsICdcbiAgICAgICAgWy4uLiwgbGFzdF0gPSBsaXN0XG4gICAgICAgIFtdLmNvbmNhdCBsaXN0WzBdLm1ha2VDb2RlKFwiW1wiKSwgYmFzZSwgbGlzdFtpbmRleF0ubWFrZUNvZGUoXCJdLmNvbmNhdChcIiksIGNvbmNhdFBhcnQsIGxhc3QubWFrZUNvZGUoXCIpXCIpXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbiMgVXNlZCB0byBza2lwIHZhbHVlcyBpbnNpZGUgYW4gYXJyYXkgZGVzdHJ1Y3R1cmluZyAocGF0dGVybiBtYXRjaGluZykgb3IgcGFyYW1ldGVyIGxpc3QuXG5cbmV4cG9ydHMuRXhwYW5zaW9uID0gY2xhc3MgRXhwYW5zaW9uIGV4dGVuZHMgQmFzZVxuXG4gICAgaXNDb21wbGV4OiBOT1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBAZXJyb3IgJ0V4cGFuc2lvbiBtdXN0IGJlIHVzZWQgaW5zaWRlIGEgZGVzdHJ1Y3R1cmluZyBhc3NpZ25tZW50IG9yIHBhcmFtZXRlciBsaXN0J1xuXG4gICAgYXNSZWZlcmVuY2U6IChvKSAtPlxuICAgICAgICB0aGlzXG5cbiAgICBlYWNoTmFtZTogKGl0ZXJhdG9yKSAtPlxuXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIEEgd2hpbGUgbG9vcCwgdGhlIG9ubHkgc29ydCBvZiBsb3ctbGV2ZWwgbG9vcCBleHBvc2VkIGJ5IEtvZmZlZS4gRnJvbVxuIyBpdCwgYWxsIG90aGVyIGxvb3BzIGNhbiBiZSBtYW51ZmFjdHVyZWQuIFVzZWZ1bCBpbiBjYXNlcyB3aGVyZSB5b3UgbmVlZCBtb3JlXG4jIGZsZXhpYmlsaXR5IG9yIG1vcmUgc3BlZWQgdGhhbiBhIGNvbXByZWhlbnNpb24gY2FuIHByb3ZpZGUuXG5cbmV4cG9ydHMuV2hpbGUgPSBjbGFzcyBXaGlsZSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoY29uZGl0aW9uLCBvcHRpb25zKSAtPlxuICAgICAgICBAY29uZGl0aW9uID0gaWYgb3B0aW9ucz8uaW52ZXJ0IHRoZW4gY29uZGl0aW9uLmludmVydCgpIGVsc2UgY29uZGl0aW9uXG4gICAgICAgIEBndWFyZCAgICAgICA9IG9wdGlvbnM/Lmd1YXJkXG5cbiAgICBjaGlsZHJlbjogWydjb25kaXRpb24nLCAnZ3VhcmQnLCAnYm9keSddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG5cbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBpZiByZXNcbiAgICAgICAgICAgIHN1cGVyXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEByZXR1cm5zID0gbm90IEBqdW1wcyBsb29wOiB5ZXNcbiAgICAgICAgICAgIHRoaXNcblxuICAgIGFkZEJvZHk6IChAYm9keSkgLT5cbiAgICAgICAgdGhpc1xuXG4gICAganVtcHM6IC0+XG4gICAgICAgIHtleHByZXNzaW9uc30gPSBAYm9keVxuICAgICAgICByZXR1cm4gbm8gdW5sZXNzIGV4cHJlc3Npb25zLmxlbmd0aFxuICAgICAgICBmb3Igbm9kZSBpbiBleHByZXNzaW9uc1xuICAgICAgICAgICAgcmV0dXJuIGp1bXBOb2RlIGlmIGp1bXBOb2RlID0gbm9kZS5qdW1wcyBsb29wOiB5ZXNcbiAgICAgICAgbm9cblxuICAgICMgVGhlIG1haW4gZGlmZmVyZW5jZSBmcm9tIGEgSmF2YVNjcmlwdCAqd2hpbGUqIGlzIHRoYXQgdGhlIEtvZmZlZVxuICAgICMgKndoaWxlKiBjYW4gYmUgdXNlZCBhcyBhIHBhcnQgb2YgYSBsYXJnZXIgZXhwcmVzc2lvbiAtLSB3aGlsZSBsb29wcyBtYXlcbiAgICAjIHJldHVybiBhbiBhcnJheSBjb250YWluaW5nIHRoZSBjb21wdXRlZCByZXN1bHQgb2YgZWFjaCBpdGVyYXRpb24uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBvLmluZGVudCArPSBUQUJcbiAgICAgICAgc2V0ICAgICAgICAgID0gJydcbiAgICAgICAge2JvZHl9ICAgPSB0aGlzXG4gICAgICAgIGlmIGJvZHkuaXNFbXB0eSgpXG4gICAgICAgICAgICBib2R5ID0gQG1ha2VDb2RlICcnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEByZXR1cm5zXG4gICAgICAgICAgICAgICAgYm9keS5tYWtlUmV0dXJuIHJ2YXIgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVzdWx0cydcbiAgICAgICAgICAgICAgICBzZXQgID0gXCIje0B0YWJ9I3tydmFyfSA9IFtdO1xcblwiXG4gICAgICAgICAgICBpZiBAZ3VhcmRcbiAgICAgICAgICAgICAgICBpZiBib2R5LmV4cHJlc3Npb25zLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICAgICAgYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IG5ldyBJZiAobmV3IFBhcmVucyBAZ3VhcmQpLmludmVydCgpLCBuZXcgU3RhdGVtZW50TGl0ZXJhbCBcImNvbnRpbnVlXCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJvZHkgPSBCbG9jay53cmFwIFtuZXcgSWYgQGd1YXJkLCBib2R5XSBpZiBAZ3VhcmRcbiAgICAgICAgICAgIGJvZHkgPSBbXS5jb25jYXQgQG1ha2VDb2RlKFwiXFxuXCIpLCAoYm9keS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifVwiKVxuICAgICAgICBhbnN3ZXIgPSBbXS5jb25jYXQgQG1ha2VDb2RlKHNldCArIEB0YWIgKyBcIndoaWxlIChcIiksIEBjb25kaXRpb24uY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIikge1wiKSwgYm9keSwgQG1ha2VDb2RlKFwifVwiKVxuICAgICAgICBpZiBAcmV0dXJuc1xuICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiXFxuI3tAdGFifXJldHVybiAje3J2YXJ9O1wiXG4gICAgICAgIGFuc3dlclxuXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAgICAgICAgIFxuXG4jIFNpbXBsZSBBcml0aG1ldGljIGFuZCBsb2dpY2FsIG9wZXJhdGlvbnMuIFBlcmZvcm1zIHNvbWUgY29udmVyc2lvbiBmcm9tIGludG8gdGhlaXIgSmF2YVNjcmlwdCBlcXVpdmFsZW50cy5cblxuZXhwb3J0cy5PcCA9IGNsYXNzIE9wIGV4dGVuZHMgQmFzZVxuICAgIEA6IChvcCwgZmlyc3QsIHNlY29uZCwgZmxpcCApIC0+XG4gICAgICAgIHJldHVybiBuZXcgSW4gZmlyc3QsIHNlY29uZCBpZiBvcCBpcyAnaW4nXG4gICAgICAgIGlmIG9wIGlzICdkbydcbiAgICAgICAgICAgIHJldHVybiBAZ2VuZXJhdGVEbyBmaXJzdFxuICAgICAgICBpZiBvcCBpcyAnbmV3J1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0Lm5ld0luc3RhbmNlKCkgaWYgZmlyc3QgaW5zdGFuY2VvZiBDYWxsIGFuZCBub3QgZmlyc3QuZG8gYW5kIG5vdCBmaXJzdC5pc05ld1xuICAgICAgICAgICAgZmlyc3QgPSBuZXcgUGFyZW5zIGZpcnN0ICAgICBpZiBmaXJzdCBpbnN0YW5jZW9mIENvZGUgYW5kIGZpcnN0LmJvdW5kIG9yIGZpcnN0LmRvXG4gICAgICAgIEBvcGVyYXRvciA9IENPTlZFUlNJT05TW29wXSBvciBvcFxuICAgICAgICBAZmlyc3QgICAgPSBmaXJzdFxuICAgICAgICBAc2Vjb25kICAgPSBzZWNvbmRcbiAgICAgICAgQGZsaXAgICAgID0gISFmbGlwXG4gICAgICAgIHJldHVybiB0aGlzXG5cbiAgICBDT05WRVJTSU9OUyA9ICMgVGhlIG1hcCBvZiBjb252ZXJzaW9ucyB0byBKYXZhU2NyaXB0IHN5bWJvbHMuXG4gICAgICAgICc9PSc6ICAgICAgICAnPT09J1xuICAgICAgICAnIT0nOiAgICAgICAgJyE9PSdcbiAgICAgICAgJ29mJzogICAgICAgICdpbidcbiAgICAgICAgJ3lpZWxkZnJvbSc6ICd5aWVsZConXG5cbiAgICBJTlZFUlNJT05TID0gIyBUaGUgbWFwIG9mIGludmVydGlibGUgb3BlcmF0b3JzLlxuICAgICAgICAnIT09JzogJz09PSdcbiAgICAgICAgJz09PSc6ICchPT0nXG5cbiAgICBjaGlsZHJlbjogWydmaXJzdCcsICdzZWNvbmQnXVxuXG4gICAgaXNOdW1iZXI6IC0+XG4gICAgICAgIEBpc1VuYXJ5KCkgYW5kIEBvcGVyYXRvciBpbiBbJysnLCAnLSddIGFuZFxuICAgICAgICAgICAgQGZpcnN0IGluc3RhbmNlb2YgVmFsdWUgYW5kIEBmaXJzdC5pc051bWJlcigpXG5cbiAgICBpc1lpZWxkOiAtPlxuICAgICAgICBAb3BlcmF0b3IgaW4gWyd5aWVsZCcsICd5aWVsZConXVxuXG4gICAgaXNVbmFyeTogLT5cbiAgICAgICAgbm90IEBzZWNvbmRcblxuICAgIGlzQ29tcGxleDogLT5cbiAgICAgICAgbm90IEBpc051bWJlcigpXG5cbiAgICAjIEFtIEkgY2FwYWJsZSBvZiBbUHl0aG9uLXN0eWxlIGNvbXBhcmlzb24gY2hhaW5pbmddKGh0dHBzOi8vZG9jcy5weXRob24ub3JnLzMvcmVmZXJlbmNlL2V4cHJlc3Npb25zLmh0bWwjbm90LWluKT9cbiAgICBcbiAgICBpc0NoYWluYWJsZTogLT5cbiAgICAgICAgQG9wZXJhdG9yIGluIFsnPCcsICc+JywgJz49JywgJzw9JywgJz09PScsICchPT0nXVxuXG4gICAgaW52ZXJ0OiAtPlxuICAgICAgICBpZiBAaXNDaGFpbmFibGUoKSBhbmQgQGZpcnN0LmlzQ2hhaW5hYmxlKClcbiAgICAgICAgICAgIGFsbEludmVydGFibGUgPSB5ZXNcbiAgICAgICAgICAgIGN1cnIgPSB0aGlzXG4gICAgICAgICAgICB3aGlsZSBjdXJyIGFuZCBjdXJyLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgYWxsSW52ZXJ0YWJsZSBhbmQ9IChjdXJyLm9wZXJhdG9yIG9mIElOVkVSU0lPTlMpXG4gICAgICAgICAgICAgICAgY3VyciA9IGN1cnIuZmlyc3RcbiAgICAgICAgICAgIHJldHVybiBuZXcgUGFyZW5zKHRoaXMpLmludmVydCgpIHVubGVzcyBhbGxJbnZlcnRhYmxlXG4gICAgICAgICAgICBjdXJyID0gdGhpc1xuICAgICAgICAgICAgd2hpbGUgY3VyciBhbmQgY3Vyci5vcGVyYXRvclxuICAgICAgICAgICAgICAgIGN1cnIuaW52ZXJ0ID0gIWN1cnIuaW52ZXJ0XG4gICAgICAgICAgICAgICAgY3Vyci5vcGVyYXRvciA9IElOVkVSU0lPTlNbY3Vyci5vcGVyYXRvcl1cbiAgICAgICAgICAgICAgICBjdXJyID0gY3Vyci5maXJzdFxuICAgICAgICAgICAgdGhpc1xuICAgICAgICBlbHNlIGlmIG9wID0gSU5WRVJTSU9OU1tAb3BlcmF0b3JdXG4gICAgICAgICAgICBAb3BlcmF0b3IgPSBvcFxuICAgICAgICAgICAgaWYgQGZpcnN0LnVud3JhcCgpIGluc3RhbmNlb2YgT3BcbiAgICAgICAgICAgICAgICBAZmlyc3QuaW52ZXJ0KClcbiAgICAgICAgICAgIHRoaXNcbiAgICAgICAgZWxzZSBpZiBAc2Vjb25kXG4gICAgICAgICAgICBuZXcgUGFyZW5zKHRoaXMpLmludmVydCgpXG4gICAgICAgIGVsc2UgaWYgQG9wZXJhdG9yIGlzICchJyBhbmQgKGZzdCA9IEBmaXJzdC51bndyYXAoKSkgaW5zdGFuY2VvZiBPcCBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnN0Lm9wZXJhdG9yIGluIFsnIScsICdpbicsICdpbnN0YW5jZW9mJ11cbiAgICAgICAgICAgIGZzdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBuZXcgT3AgJyEnLCB0aGlzXG5cbiAgICB1bmZvbGRTb2FrOiAobykgLT5cbiAgICAgICAgQG9wZXJhdG9yIGluIFsnKysnLCAnLS0nLCAnZGVsZXRlJ10gYW5kIHVuZm9sZFNvYWsgbywgdGhpcywgJ2ZpcnN0J1xuXG4gICAgZ2VuZXJhdGVEbzogKGV4cCkgLT5cbiAgICAgICAgcGFzc2VkUGFyYW1zID0gW11cbiAgICAgICAgZnVuYyA9IGlmIGV4cCBpbnN0YW5jZW9mIEFzc2lnbiBhbmQgKHJlZiA9IGV4cC52YWx1ZS51bndyYXAoKSkgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICByZWZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXhwXG4gICAgICAgIGZvciBwYXJhbSBpbiBmdW5jLnBhcmFtcyBvciBbXVxuICAgICAgICAgICAgaWYgcGFyYW0udmFsdWVcbiAgICAgICAgICAgICAgICBwYXNzZWRQYXJhbXMucHVzaCBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBhc3NlZFBhcmFtcy5wdXNoIHBhcmFtXG4gICAgICAgIGNhbGwgPSBuZXcgQ2FsbCBleHAsIHBhc3NlZFBhcmFtc1xuICAgICAgICBjYWxsLmRvID0geWVzXG4gICAgICAgIGNhbGxcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgaXNDaGFpbiA9IEBpc0NoYWluYWJsZSgpIGFuZCBAZmlyc3QuaXNDaGFpbmFibGUoKVxuICAgICAgICAjIEluIGNoYWlucywgdGhlcmUncyBubyBuZWVkIHRvIHdyYXAgYmFyZSBvYmogbGl0ZXJhbHMgaW4gcGFyZW5zLFxuICAgICAgICAjIGFzIHRoZSBjaGFpbmVkIGV4cHJlc3Npb24gaXMgd3JhcHBlZC5cbiAgICAgICAgQGZpcnN0LmZyb250ID0gQGZyb250IHVubGVzcyBpc0NoYWluXG4gICAgICAgIGlmIEBvcGVyYXRvciBpcyAnZGVsZXRlJyBhbmQgby5zY29wZS5jaGVjayhAZmlyc3QudW53cmFwQWxsKCkudmFsdWUpXG4gICAgICAgICAgICBAZXJyb3IgJ2RlbGV0ZSBvcGVyYW5kIG1heSBub3QgYmUgYXJndW1lbnQgb3IgdmFyJ1xuICAgICAgICBpZiBAb3BlcmF0b3IgaW4gWyctLScsICcrKyddXG4gICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgQGZpcnN0LnVud3JhcEFsbCgpLnZhbHVlXG4gICAgICAgICAgICBAZmlyc3QuZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgIHJldHVybiBAY29tcGlsZVlpZWxkIG8gaWYgQGlzWWllbGQoKVxuICAgICAgICByZXR1cm4gQGNvbXBpbGVVbmFyeSBvIGlmIEBpc1VuYXJ5KClcbiAgICAgICAgcmV0dXJuIEBjb21waWxlQ2hhaW4gbyBpZiBpc0NoYWluXG4gICAgICAgIHN3aXRjaCBAb3BlcmF0b3JcbiAgICAgICAgICAgIHdoZW4gJz8nICAgIHRoZW4gQGNvbXBpbGVFeGlzdGVuY2Ugb1xuICAgICAgICAgICAgd2hlbiAnKionIHRoZW4gQGNvbXBpbGVQb3dlciBvXG4gICAgICAgICAgICB3aGVuICcvLycgdGhlbiBAY29tcGlsZUZsb29yRGl2aXNpb24gb1xuICAgICAgICAgICAgd2hlbiAnJSUnIHRoZW4gQGNvbXBpbGVNb2R1bG8gb1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxocyA9IEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgICAgICAgICByaHMgPSBAc2Vjb25kLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUFxuICAgICAgICAgICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBsaHMsIEBtYWtlQ29kZShcIiAje0BvcGVyYXRvcn0gXCIpLCByaHNcbiAgICAgICAgICAgICAgICBpZiBvLmxldmVsIDw9IExFVkVMX09QIHRoZW4gYW5zd2VyIGVsc2UgQHdyYXBJbkJyYWNlcyBhbnN3ZXJcblxuICAgICMgTWltaWMgUHl0aG9uJ3MgY2hhaW5lZCBjb21wYXJpc29ucyB3aGVuIG11bHRpcGxlIGNvbXBhcmlzb24gb3BlcmF0b3JzIGFyZVxuICAgICMgdXNlZCBzZXF1ZW50aWFsbHkuIEZvciBleGFtcGxlOlxuICAgICNcbiAgICAjICAgICAgICAgICBiaW4va29mZmVlIC1lICdjb25zb2xlLmxvZyA1MCA8IDY1ID4gMTAnXG4gICAgIyAgICAgICAgICAgdHJ1ZVxuICAgIFxuICAgIGNvbXBpbGVDaGFpbjogKG8pIC0+XG4gICAgICAgIFtAZmlyc3Quc2Vjb25kLCBzaGFyZWRdID0gQGZpcnN0LnNlY29uZC5jYWNoZSBvXG4gICAgICAgIGZzdCA9IEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgZnJhZ21lbnRzID0gZnN0LmNvbmNhdCBAbWFrZUNvZGUoXCIgI3tpZiBAaW52ZXJ0IHRoZW4gJyYmJyBlbHNlICd8fCd9IFwiKSxcbiAgICAgICAgICAgIChzaGFyZWQuY29tcGlsZVRvRnJhZ21lbnRzIG8pLCBAbWFrZUNvZGUoXCIgI3tAb3BlcmF0b3J9IFwiKSwgKEBzZWNvbmQuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QKVxuICAgICAgICBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgIyBLZWVwIHJlZmVyZW5jZSB0byB0aGUgbGVmdCBleHByZXNzaW9uLCB1bmxlc3MgdGhpcyBhbiBleGlzdGVudGlhbCBhc3NpZ25tZW50XG4gICAgY29tcGlsZUV4aXN0ZW5jZTogKG8pIC0+XG4gICAgICAgIGlmIEBmaXJzdC5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgcmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnXG4gICAgICAgICAgICBmc3QgPSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gcmVmLCBAZmlyc3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnN0ID0gQGZpcnN0XG4gICAgICAgICAgICByZWYgPSBmc3RcbiAgICAgICAgbmV3IElmKG5ldyBFeGlzdGVuY2UoZnN0KSwgcmVmLCB0eXBlOiAnaWYnKS5hZGRFbHNlKEBzZWNvbmQpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICAjIENvbXBpbGUgYSB1bmFyeSAqKk9wKiouXG4gICAgY29tcGlsZVVuYXJ5OiAobykgLT5cbiAgICAgICAgcGFydHMgPSBbXVxuICAgICAgICBvcCA9IEBvcGVyYXRvclxuICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgb3BdXG4gICAgICAgIGlmIG9wIGlzICchJyBhbmQgQGZpcnN0IGluc3RhbmNlb2YgRXhpc3RlbmNlXG4gICAgICAgICAgICBAZmlyc3QubmVnYXRlZCA9IG5vdCBAZmlyc3QubmVnYXRlZFxuICAgICAgICAgICAgcmV0dXJuIEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICBpZiBvLmxldmVsID49IExFVkVMX0FDQ0VTU1xuICAgICAgICAgICAgcmV0dXJuIChuZXcgUGFyZW5zIHRoaXMpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIHBsdXNNaW51cyA9IG9wIGluIFsnKycsICctJ11cbiAgICAgICAgcGFydHMucHVzaCBbQG1ha2VDb2RlKCcgJyldIGlmIG9wIGluIFsnbmV3JywgJ3R5cGVvZicsICdkZWxldGUnXSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVzTWludXMgYW5kIEBmaXJzdCBpbnN0YW5jZW9mIE9wIGFuZCBAZmlyc3Qub3BlcmF0b3IgaXMgb3BcbiAgICAgICAgaWYgKHBsdXNNaW51cyBhbmQgQGZpcnN0IGluc3RhbmNlb2YgT3ApIG9yIChvcCBpcyAnbmV3JyBhbmQgQGZpcnN0LmlzU3RhdGVtZW50IG8pXG4gICAgICAgICAgICBAZmlyc3QgPSBuZXcgUGFyZW5zIEBmaXJzdFxuICAgICAgICBwYXJ0cy5wdXNoIEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgcGFydHMucmV2ZXJzZSgpIGlmIEBmbGlwXG4gICAgICAgIEBqb2luRnJhZ21lbnRBcnJheXMgcGFydHMsICcnXG5cbiAgICBjb21waWxlWWllbGQ6IChvKSAtPlxuICAgICAgICBwYXJ0cyA9IFtdXG4gICAgICAgIG9wID0gQG9wZXJhdG9yXG4gICAgICAgIHVubGVzcyBvLnNjb3BlLnBhcmVudD9cbiAgICAgICAgICAgIEBlcnJvciAneWllbGQgY2FuIG9ubHkgb2NjdXIgaW5zaWRlIGZ1bmN0aW9ucydcbiAgICAgICAgaWYgJ2V4cHJlc3Npb24nIGluIE9iamVjdC5rZXlzKEBmaXJzdCkgYW5kIG5vdCAoQGZpcnN0IGluc3RhbmNlb2YgVGhyb3cpXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIEBmaXJzdC5leHByZXNzaW9uLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUCBpZiBAZmlyc3QuZXhwcmVzc2lvbj9cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGFydHMucHVzaCBbQG1ha2VDb2RlIFwiKFwiXSBpZiBvLmxldmVsID49IExFVkVMX1BBUkVOXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgb3BdXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgXCIgXCJdIGlmIEBmaXJzdC5iYXNlPy52YWx1ZSAhPSAnJ1xuICAgICAgICAgICAgcGFydHMucHVzaCBAZmlyc3QuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgXCIpXCJdIGlmIG8ubGV2ZWwgPj0gTEVWRUxfUEFSRU5cbiAgICAgICAgQGpvaW5GcmFnbWVudEFycmF5cyBwYXJ0cywgJydcblxuICAgIGNvbXBpbGVQb3dlcjogKG8pIC0+XG4gICAgICAgICMgTWFrZSBhIE1hdGgucG93IGNhbGxcbiAgICAgICAgcG93ID0gbmV3IFZhbHVlIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCgnTWF0aCcpLCBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdwb3cnXVxuICAgICAgICBuZXcgQ2FsbChwb3csIFtAZmlyc3QsIEBzZWNvbmRdKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgY29tcGlsZUZsb29yRGl2aXNpb246IChvKSAtPlxuICAgICAgICBmbG9vciA9IG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwoJ01hdGgnKSwgW25ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAnZmxvb3InXVxuICAgICAgICBzZWNvbmQgPSBpZiBAc2Vjb25kLmlzQ29tcGxleCgpIHRoZW4gbmV3IFBhcmVucyBAc2Vjb25kIGVsc2UgQHNlY29uZFxuICAgICAgICBkaXYgPSBuZXcgT3AgJy8nLCBAZmlyc3QsIHNlY29uZFxuICAgICAgICBuZXcgQ2FsbChmbG9vciwgW2Rpdl0pLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICBjb21waWxlTW9kdWxvOiAobykgLT5cbiAgICAgICAgbW9kID0gbmV3IFZhbHVlIG5ldyBMaXRlcmFsIHV0aWxpdHkgJ21vZHVsbycsIG9cbiAgICAgICAgbmV3IENhbGwobW9kLCBbQGZpcnN0LCBAc2Vjb25kXSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgIHRvU3RyaW5nOiAoaWR0KSAtPlxuICAgICAgICBzdXBlciBpZHQsIEBjb25zdHJ1Y3Rvci5uYW1lICsgJyAnICsgQG9wZXJhdG9yXG5cbiMgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgXG5cbmV4cG9ydHMuSW4gPSBjbGFzcyBJbiBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQG9iamVjdCwgQGFycmF5KSAtPlxuXG4gICAgY2hpbGRyZW46IFsnb2JqZWN0JywgJ2FycmF5J11cblxuICAgIGludmVydDogTkVHQVRFXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGlmIEBhcnJheSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBAYXJyYXkuaXNBcnJheSgpIGFuZCBAYXJyYXkuYmFzZS5vYmplY3RzLmxlbmd0aFxuICAgICAgICAgICAgZm9yIG9iaiBpbiBAYXJyYXkuYmFzZS5vYmplY3RzIHdoZW4gb2JqIGluc3RhbmNlb2YgU3BsYXRcbiAgICAgICAgICAgICAgICBoYXNTcGxhdCA9IHllc1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAjIGBjb21waWxlT3JUZXN0YCBvbmx5IGlmIHdlIGhhdmUgYW4gYXJyYXkgbGl0ZXJhbCB3aXRoIG5vIHNwbGF0c1xuICAgICAgICAgICAgcmV0dXJuIEBjb21waWxlT3JUZXN0IG8gdW5sZXNzIGhhc1NwbGF0XG4gICAgICAgIEBjb21waWxlTG9vcFRlc3Qgb1xuXG4gICAgY29tcGlsZU9yVGVzdDogKG8pIC0+XG4gICAgICAgIFtzdWIsIHJlZl0gPSBAb2JqZWN0LmNhY2hlIG8sIExFVkVMX09QXG4gICAgICAgIFtjbXAsIGNual0gPSBpZiBAbmVnYXRlZCB0aGVuIFsnICE9PSAnLCAnICYmICddIGVsc2UgWycgPT09ICcsICcgfHwgJ11cbiAgICAgICAgdGVzdHMgPSBbXVxuICAgICAgICBmb3IgaXRlbSwgaSBpbiBAYXJyYXkuYmFzZS5vYmplY3RzXG4gICAgICAgICAgICBpZiBpIHRoZW4gdGVzdHMucHVzaCBAbWFrZUNvZGUgY25qXG4gICAgICAgICAgICB0ZXN0cyA9IHRlc3RzLmNvbmNhdCAoaWYgaSB0aGVuIHJlZiBlbHNlIHN1YiksIEBtYWtlQ29kZShjbXApLCBpdGVtLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9BQ0NFU1MpXG4gICAgICAgIGlmIG8ubGV2ZWwgPCBMRVZFTF9PUCB0aGVuIHRlc3RzIGVsc2UgQHdyYXBJbkJyYWNlcyB0ZXN0c1xuXG4gICAgY29tcGlsZUxvb3BUZXN0OiAobykgLT5cbiAgICAgICAgW3N1YiwgcmVmXSA9IEBvYmplY3QuY2FjaGUgbywgTEVWRUxfTElTVFxuICAgICAgICBmcmFnbWVudHMgPSBbXS5jb25jYXQgQG1ha2VDb2RlKHV0aWxpdHkoJ2luZGV4T2YnLCBvKSArIFwiLmNhbGwoXCIpLCBAYXJyYXkuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX0xJU1QpLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiLCBcIiksIHJlZiwgQG1ha2VDb2RlKFwiKSBcIiArIGlmIEBuZWdhdGVkIHRoZW4gJzwgMCcgZWxzZSAnPj0gMCcpXG4gICAgICAgIHJldHVybiBmcmFnbWVudHMgaWYgQGZyYWdtZW50c1RvVGV4dChzdWIpIGlzIEBmcmFnbWVudHNUb1RleHQocmVmKVxuICAgICAgICBmcmFnbWVudHMgPSBzdWIuY29uY2F0IEBtYWtlQ29kZSgnLCAnKSwgZnJhZ21lbnRzXG4gICAgICAgIGlmIG8ubGV2ZWwgPCBMRVZFTF9MSVNUIHRoZW4gZnJhZ21lbnRzIGVsc2UgQHdyYXBJbkJyYWNlcyBmcmFnbWVudHNcblxuICAgIHRvU3RyaW5nOiAoaWR0KSAtPlxuICAgICAgICBzdXBlciBpZHQsIEBjb25zdHJ1Y3Rvci5uYW1lICsgaWYgQG5lZ2F0ZWQgdGhlbiAnIScgZWxzZSAnJ1xuXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiMgICAgMDAwICAgICAwMDAwMDAwICAgICAgMDAwMDAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuIyBBIGNsYXNzaWMgKnRyeS9jYXRjaC9maW5hbGx5KiBibG9jay5cblxuZXhwb3J0cy5UcnkgPSBjbGFzcyBUcnkgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBhdHRlbXB0LCBAZXJyb3JWYXJpYWJsZSwgQHJlY292ZXJ5LCBAZW5zdXJlKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnYXR0ZW1wdCcsICdyZWNvdmVyeScsICdlbnN1cmUnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuXG4gICAganVtcHM6IChvKSAtPiBAYXR0ZW1wdC5qdW1wcyhvKSBvciBAcmVjb3Zlcnk/Lmp1bXBzKG8pXG5cbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBAYXR0ZW1wdCAgPSBAYXR0ZW1wdCAubWFrZVJldHVybiByZXMgaWYgQGF0dGVtcHRcbiAgICAgICAgQHJlY292ZXJ5ID0gQHJlY292ZXJ5Lm1ha2VSZXR1cm4gcmVzIGlmIEByZWNvdmVyeVxuICAgICAgICB0aGlzXG5cbiAgICAjIENvbXBpbGF0aW9uIGlzIG1vcmUgb3IgbGVzcyBhcyB5b3Ugd291bGQgZXhwZWN0IC0tIHRoZSAqZmluYWxseSogY2xhdXNlXG4gICAgIyBpcyBvcHRpb25hbCwgdGhlICpjYXRjaCogaXMgbm90LlxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIHRyeVBhcnQgICA9IEBhdHRlbXB0LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcblxuICAgICAgICBjYXRjaFBhcnQgPSBpZiBAcmVjb3ZlcnlcbiAgICAgICAgICAgIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2Vycm9yJywgcmVzZXJ2ZTogbm9cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lXG4gICAgICAgICAgICBpZiBAZXJyb3JWYXJpYWJsZVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBAZXJyb3JWYXJpYWJsZS51bndyYXBBbGwoKS52YWx1ZVxuICAgICAgICAgICAgICAgIEBlcnJvclZhcmlhYmxlLmVycm9yIG1lc3NhZ2UgaWYgbWVzc2FnZVxuICAgICAgICAgICAgICAgIEByZWNvdmVyeS51bnNoaWZ0IG5ldyBBc3NpZ24gQGVycm9yVmFyaWFibGUsIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKFwiIGNhdGNoIChcIiksIHBsYWNlaG9sZGVyLmNvbXBpbGVUb0ZyYWdtZW50cyhvKSwgQG1ha2VDb2RlKFwiKSB7XFxuXCIpLFxuICAgICAgICAgICAgICAgIEByZWNvdmVyeS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifX1cIilcbiAgICAgICAgZWxzZSB1bmxlc3MgQGVuc3VyZSBvciBAcmVjb3ZlcnlcbiAgICAgICAgICAgIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2Vycm9yJywgcmVzZXJ2ZTogbm9cbiAgICAgICAgICAgIFtAbWFrZUNvZGUoXCIgY2F0Y2ggKCN7Z2VuZXJhdGVkRXJyb3JWYXJpYWJsZU5hbWV9KSB7fVwiKV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgW11cblxuICAgICAgICBlbnN1cmVQYXJ0ID0gaWYgQGVuc3VyZSB0aGVuIChbXS5jb25jYXQgQG1ha2VDb2RlKFwiIGZpbmFsbHkge1xcblwiKSwgQGVuc3VyZS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKSxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIlxcbiN7QHRhYn19XCIpKSBlbHNlIFtdXG5cbiAgICAgICAgW10uY29uY2F0IEBtYWtlQ29kZShcIiN7QHRhYn10cnkge1xcblwiKSxcbiAgICAgICAgICAgIHRyeVBhcnQsXG4gICAgICAgICAgICBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9fVwiKSwgY2F0Y2hQYXJ0LCBlbnN1cmVQYXJ0XG5cbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG5cbiMgU2ltcGxlIG5vZGUgdG8gdGhyb3cgYW4gZXhjZXB0aW9uLlxuXG5leHBvcnRzLlRocm93ID0gY2xhc3MgVGhyb3cgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBleHByZXNzaW9uKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnZXhwcmVzc2lvbiddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG4gICAganVtcHM6ICAgICAgIE5PXG5cbiAgICAjIEEgKipUaHJvdyoqIGlzIGFscmVhZHkgYSByZXR1cm4sIG9mIHNvcnRzLi4uXG4gICAgbWFrZVJldHVybjogVEhJU1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKEB0YWIgKyBcInRocm93IFwiKSwgQGV4cHJlc3Npb24uY29tcGlsZVRvRnJhZ21lbnRzKG8pLCBAbWFrZUNvZGUoXCI7XCIpXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiMgQ2hlY2tzIGEgdmFyaWFibGUgZm9yIGV4aXN0ZW5jZSAtLSBub3QgKm51bGwqIGFuZCBub3QgKnVuZGVmaW5lZCouIFRoaXMgaXNcbiMgc2ltaWxhciB0byBgLm5pbD9gIGluIFJ1YnksIGFuZCBhdm9pZHMgaGF2aW5nIHRvIGNvbnN1bHQgYSBKYXZhU2NyaXB0IHRydXRoXG4jIHRhYmxlLlxuXG5leHBvcnRzLkV4aXN0ZW5jZSA9IGNsYXNzIEV4aXN0ZW5jZSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoQGV4cHJlc3Npb24pIC0+XG5cbiAgICBjaGlsZHJlbjogWydleHByZXNzaW9uJ11cblxuICAgIGludmVydDogTkVHQVRFXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBleHByZXNzaW9uLmZyb250ID0gQGZyb250XG4gICAgICAgIGNvZGUgPSBAZXhwcmVzc2lvbi5jb21waWxlIG8sIExFVkVMX09QXG4gICAgICAgIGlmIEBleHByZXNzaW9uLnVud3JhcCgpIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgYW5kIG5vdCBvLnNjb3BlLmNoZWNrIGNvZGVcbiAgICAgICAgICAgIFtjbXAsIGNual0gPSBpZiBAbmVnYXRlZCB0aGVuIFsnPT09JywgJ3x8J10gZWxzZSBbJyE9PScsICcmJiddXG4gICAgICAgICAgICBjb2RlID0gXCJ0eXBlb2YgI3tjb2RlfSAje2NtcH0gXFxcInVuZGVmaW5lZFxcXCIgI3tjbmp9ICN7Y29kZX0gI3tjbXB9IG51bGxcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIGRvIG5vdCB1c2Ugc3RyaWN0IGVxdWFsaXR5IGhlcmU7IGl0IHdpbGwgYnJlYWsgZXhpc3RpbmcgY29kZVxuICAgICAgICAgICAgY29kZSA9IFwiI3tjb2RlfSAje2lmIEBuZWdhdGVkIHRoZW4gJz09JyBlbHNlICchPSd9IG51bGxcIlxuICAgICAgICBbQG1ha2VDb2RlKGlmIG8ubGV2ZWwgPD0gTEVWRUxfQ09ORCB0aGVuIGNvZGUgZWxzZSBcIigje2NvZGV9KVwiKV1cblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxuIyBBbiBleHRyYSBzZXQgb2YgcGFyZW50aGVzZXMsIHNwZWNpZmllZCBleHBsaWNpdGx5IGluIHRoZSBzb3VyY2UuIEF0IG9uZSB0aW1lXG4jIHdlIHRyaWVkIHRvIGNsZWFuIHVwIHRoZSByZXN1bHRzIGJ5IGRldGVjdGluZyBhbmQgcmVtb3ZpbmcgcmVkdW5kYW50XG4jIHBhcmVudGhlc2VzLCBidXQgbm8gbG9uZ2VyIC0tIHlvdSBjYW4gcHV0IGluIGFzIG1hbnkgYXMgeW91IHBsZWFzZS5cbiNcbiMgUGFyZW50aGVzZXMgYXJlIGEgZ29vZCB3YXkgdG8gZm9yY2UgYW55IHN0YXRlbWVudCB0byBiZWNvbWUgYW4gZXhwcmVzc2lvbi5cblxuZXhwb3J0cy5QYXJlbnMgPSBjbGFzcyBQYXJlbnMgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgQDogKEBib2R5KSAtPlxuXG4gICAgY2hpbGRyZW46IFsnYm9keSddXG5cbiAgICB1bndyYXA6ICAgIC0+IEBib2R5XG4gICAgaXNDb21wbGV4OiAtPiBAYm9keS5pc0NvbXBsZXgoKVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBleHByID0gQGJvZHkudW53cmFwKClcbiAgICAgICAgaWYgZXhwciBpbnN0YW5jZW9mIFZhbHVlIGFuZCBleHByLmlzQXRvbWljKClcbiAgICAgICAgICAgIGV4cHIuZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgICAgIHJldHVybiBleHByLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIGZyYWdtZW50cyA9IGV4cHIuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgIGJhcmUgPSBvLmxldmVsIDwgTEVWRUxfT1AgYW5kIChleHByIGluc3RhbmNlb2YgT3Agb3IgZXhwciBpbnN0YW5jZW9mIENhbGwgb3JcbiAgICAgICAgICAgIChleHByIGluc3RhbmNlb2YgRm9yIGFuZCBleHByLnJldHVybnMpKSBhbmQgKG8ubGV2ZWwgPCBMRVZFTF9DT05EIG9yXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLmxlbmd0aCA8PSAzKVxuICAgICAgICBpZiBiYXJlIHRoZW4gZnJhZ21lbnRzIGVsc2UgQHdyYXBJbkJyYWNlcyBmcmFnbWVudHNcblxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiMgU3RyaW5ncyB3aXRoIGludGVycG9sYXRpb25zIGFyZSBpbiBmYWN0IGp1c3QgYSB2YXJpYXRpb24gb2YgYFBhcmVuc2Agd2l0aCBzdHJpbmcgY29uY2F0ZW5hdGlvbiBpbnNpZGUuXG5cbmV4cG9ydHMuU3RyaW5nV2l0aEludGVycG9sYXRpb25zID0gY2xhc3MgU3RyaW5nV2l0aEludGVycG9sYXRpb25zIGV4dGVuZHMgUGFyZW5zXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgIyBUaGlzIG1ldGhvZCBwcm9kdWNlcyBhbiBpbnRlcnBvbGF0ZWQgc3RyaW5nIHVzaW5nIHRoZSBuZXcgRVMyMDE1IHN5bnRheCxcbiAgICAgICAgIyB3aGljaCBpcyBvcHQtaW4gYnkgdXNpbmcgdGFnZ2VkIHRlbXBsYXRlIGxpdGVyYWxzLiBcbiAgICAgICAgIyBJZiB0aGlzIFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9ucyBpc27igJl0IGluc2lkZSBhIHRhZ2dlZCB0ZW1wbGF0ZSBsaXRlcmFsLCBmYWxsIGJhY2sgdG8gdGhlIEtvZmZlZSAxLnggb3V0cHV0LlxuICAgICAgICBcbiAgICAgICAgdW5sZXNzIG8uaW5UYWdnZWRUZW1wbGF0ZUNhbGxcbiAgICAgICAgICAgIHJldHVybiBzdXBlclxuXG4gICAgICAgIGV4cHIgPSBAYm9keS51bndyYXAoKSAjIEFzc3VtcHRpb246IGV4cHIgaXMgVmFsdWU+U3RyaW5nTGl0ZXJhbCBvciBPcFxuXG4gICAgICAgIGVsZW1lbnRzID0gW11cbiAgICAgICAgZXhwci50cmF2ZXJzZUNoaWxkcmVuIG5vLCAobm9kZSkgLT5cbiAgICAgICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBTdHJpbmdMaXRlcmFsXG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaCBub2RlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHllc1xuICAgICAgICAgICAgZWxzZSBpZiBub2RlIGluc3RhbmNlb2YgUGFyZW5zXG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaCBub2RlXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vXG4gICAgICAgICAgICByZXR1cm4geWVzXG5cbiAgICAgICAgZnJhZ21lbnRzID0gW11cbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdgJ1xuICAgICAgICBmb3IgZWxlbWVudCBpbiBlbGVtZW50c1xuICAgICAgICAgICAgaWYgZWxlbWVudCBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGVsZW1lbnQudmFsdWVbMS4uLi0xXVxuICAgICAgICAgICAgICAgICMgQmFja3RpY2tzIGFuZCBgJHtgIGluc2lkZSB0ZW1wbGF0ZSBsaXRlcmFscyBtdXN0IGJlIGVzY2FwZWQuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIC8oXFxcXCopKGB8XFwkXFx7KS9nLCAobWF0Y2gsIGJhY2tzbGFzaGVzLCB0b0JlRXNjYXBlZCkgLT5cbiAgICAgICAgICAgICAgICAgICAgaWYgYmFja3NsYXNoZXMubGVuZ3RoICUgMiBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiN7YmFja3NsYXNoZXN9XFxcXCN7dG9CZUVzY2FwZWR9XCJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgdmFsdWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgJyR7J1xuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIGVsZW1lbnQuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKS4uLlxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSAnfSdcbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdgJ1xuXG4gICAgICAgIGZyYWdtZW50c1xuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbiMgUmVwbGFjZW1lbnQgZm9yIHRoZSAqZm9yKiBsb29wIGlzIG91ciBhcnJheSBhbmQgb2JqZWN0XG4jIGNvbXByZWhlbnNpb25zLCB0aGF0IGNvbXBpbGUgaW50byAqZm9yKiBsb29wcyBoZXJlLiBUaGV5IGFsc28gYWN0IGFzIGFuXG4jIGV4cHJlc3Npb24sIGFibGUgdG8gcmV0dXJuIHRoZSByZXN1bHQgb2YgZWFjaCBmaWx0ZXJlZCBpdGVyYXRpb24uXG4jXG4jIFVubGlrZSBQeXRob24gYXJyYXkgY29tcHJlaGVuc2lvbnMsIHRoZXkgY2FuIGJlIG11bHRpLWxpbmUsIGFuZCB5b3UgY2FuIHBhc3NcbiMgdGhlIGN1cnJlbnQgaW5kZXggb2YgdGhlIGxvb3AgYXMgYSBzZWNvbmQgcGFyYW1ldGVyLiBVbmxpa2UgUnVieSBibG9ja3MsXG4jIHlvdSBjYW4gbWFwIGFuZCBmaWx0ZXIgaW4gYSBzaW5nbGUgcGFzcy5cblxuZXhwb3J0cy5Gb3IgPSBjbGFzcyBGb3IgZXh0ZW5kcyBXaGlsZVxuICAgIEA6IChib2R5LCBzb3VyY2UpIC0+XG4gICAgICAgIHtAc291cmNlLCBAZ3VhcmQsIEBzdGVwLCBAbmFtZSwgQGluZGV4fSA9IHNvdXJjZVxuICAgICAgICBAYm9keSAgID0gQmxvY2sud3JhcCBbYm9keV1cbiAgICAgICAgQG93biAgICA9ICEhc291cmNlLm93blxuICAgICAgICBAb2JqZWN0ID0gISFzb3VyY2Uub2JqZWN0XG4gICAgICAgIEBmcm9tICAgPSAhIXNvdXJjZS5mcm9tXG4gICAgICAgIEBpbmRleC5lcnJvciAnY2Fubm90IHVzZSBpbmRleCB3aXRoIGZvci1mcm9tJyBpZiBAZnJvbSBhbmQgQGluZGV4XG4gICAgICAgIHNvdXJjZS5vd25UYWcuZXJyb3IgXCJjYW5ub3QgdXNlIG93biB3aXRoIGZvci0je2lmIEBmcm9tIHRoZW4gJ2Zyb20nIGVsc2UgJ2luJ31cIiBpZiBAb3duIGFuZCBub3QgQG9iamVjdFxuICAgICAgICBbQG5hbWUsIEBpbmRleF0gPSBbQGluZGV4LCBAbmFtZV0gaWYgQG9iamVjdFxuICAgICAgICBAaW5kZXguZXJyb3IgJ2luZGV4IGNhbm5vdCBiZSBhIHBhdHRlcm4gbWF0Y2hpbmcgZXhwcmVzc2lvbicgaWYgQGluZGV4IGluc3RhbmNlb2YgVmFsdWUgYW5kIG5vdCBAaW5kZXguaXNBc3NpZ25hYmxlKClcbiAgICAgICAgQHJhbmdlICAgPSBAc291cmNlIGluc3RhbmNlb2YgVmFsdWUgYW5kIEBzb3VyY2UuYmFzZSBpbnN0YW5jZW9mIFJhbmdlIGFuZCBub3QgQHNvdXJjZS5wcm9wZXJ0aWVzLmxlbmd0aCBhbmQgbm90IEBmcm9tXG4gICAgICAgIEBwYXR0ZXJuID0gQG5hbWUgaW5zdGFuY2VvZiBWYWx1ZVxuICAgICAgICBAaW5kZXguZXJyb3IgJ2luZGV4ZXMgZG8gbm90IGFwcGx5IHRvIHJhbmdlIGxvb3BzJyBpZiBAcmFuZ2UgYW5kIEBpbmRleFxuICAgICAgICBAbmFtZS5lcnJvciAnY2Fubm90IHBhdHRlcm4gbWF0Y2ggb3ZlciByYW5nZSBsb29wcycgaWYgQHJhbmdlIGFuZCBAcGF0dGVyblxuICAgICAgICBAcmV0dXJucyA9IGZhbHNlXG5cbiAgICBjaGlsZHJlbjogWydib2R5JywgJ3NvdXJjZScsICdndWFyZCcsICdzdGVwJ11cblxuICAgICMgV2VsY29tZSB0byB0aGUgaGFpcmllc3QgbWV0aG9kIGluIGFsbCBvZiBLb2ZmZWUuIEhhbmRsZXMgdGhlIGlubmVyXG4gICAgIyBsb29wLCBmaWx0ZXJpbmcsIHN0ZXBwaW5nLCBhbmQgcmVzdWx0IHNhdmluZyBmb3IgYXJyYXksIG9iamVjdCwgYW5kIHJhbmdlXG4gICAgIyBjb21wcmVoZW5zaW9ucy4gU29tZSBvZiB0aGUgZ2VuZXJhdGVkIGNvZGUgY2FuIGJlIHNoYXJlZCBpbiBjb21tb24sIGFuZFxuICAgICMgc29tZSBjYW5ub3QuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBib2R5ICAgICAgICA9IEJsb2NrLndyYXAgW0Bib2R5XVxuICAgICAgICBbLi4uLCBsYXN0XSA9IGJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgQHJldHVybnMgICAgPSBubyBpZiBsYXN0Py5qdW1wcygpIGluc3RhbmNlb2YgUmV0dXJuXG4gICAgICAgIHNvdXJjZSAgICAgID0gaWYgQHJhbmdlIHRoZW4gQHNvdXJjZS5iYXNlIGVsc2UgQHNvdXJjZVxuICAgICAgICBzY29wZSAgICAgICA9IG8uc2NvcGVcbiAgICAgICAgbmFtZSAgICAgICAgPSBAbmFtZSAgYW5kIChAbmFtZS5jb21waWxlIG8sIExFVkVMX0xJU1QpIGlmIG5vdCBAcGF0dGVyblxuICAgICAgICBpbmRleCAgICAgICA9IEBpbmRleCBhbmQgKEBpbmRleC5jb21waWxlIG8sIExFVkVMX0xJU1QpXG4gICAgICAgIHNjb3BlLmZpbmQobmFtZSkgIGlmIG5hbWUgYW5kIG5vdCBAcGF0dGVyblxuICAgICAgICBzY29wZS5maW5kKGluZGV4KSBpZiBpbmRleCBhbmQgQGluZGV4IG5vdCBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgIHJ2YXIgPSBzY29wZS5mcmVlVmFyaWFibGUgJ3Jlc3VsdHMnIGlmIEByZXR1cm5zXG4gICAgICAgIGlmIEBmcm9tXG4gICAgICAgICAgICBpdmFyID0gc2NvcGUuZnJlZVZhcmlhYmxlICd4Jywgc2luZ2xlOiB0cnVlIGlmIEBwYXR0ZXJuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGl2YXIgPSAoQG9iamVjdCBhbmQgaW5kZXgpIG9yIHNjb3BlLmZyZWVWYXJpYWJsZSAnaScsIHNpbmdsZTogdHJ1ZVxuICAgICAgICBrdmFyID0gKChAcmFuZ2Ugb3IgQGZyb20pIGFuZCBuYW1lKSBvciBpbmRleCBvciBpdmFyXG4gICAgICAgIGt2YXJBc3NpZ24gID0gaWYga3ZhciAhPSBpdmFyIHRoZW4gXCIje2t2YXJ9ID0gXCIgZWxzZSBcIlwiXG4gICAgICAgIGlmIEBzdGVwIGFuZCBub3QgQHJhbmdlXG4gICAgICAgICAgICBbc3RlcCwgc3RlcFZhcl0gPSBAY2FjaGVUb0NvZGVGcmFnbWVudHMgQHN0ZXAuY2FjaGUgbywgTEVWRUxfTElTVCwgaXNDb21wbGV4T3JBc3NpZ25hYmxlXG4gICAgICAgICAgICBzdGVwTnVtID0gTnVtYmVyIHN0ZXBWYXIgaWYgQHN0ZXAuaXNOdW1iZXIoKVxuICAgICAgICBuYW1lICAgICAgPSBpdmFyIGlmIEBwYXR0ZXJuXG4gICAgICAgIHZhclBhcnQgICA9ICcnXG4gICAgICAgIGd1YXJkUGFydCA9ICcnXG4gICAgICAgIGRlZlBhcnQgICA9ICcnXG4gICAgICAgIGlkdDEgICAgICA9IEB0YWIgKyBUQUJcbiAgICAgICAgaWYgQHJhbmdlXG4gICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzID0gc291cmNlLmNvbXBpbGVUb0ZyYWdtZW50cyBtZXJnZSBvLFxuICAgICAgICAgICAgICAgIHtpbmRleDogaXZhciwgbmFtZSwgQHN0ZXAsIGlzQ29tcGxleDogaXNDb21wbGV4T3JBc3NpZ25hYmxlfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzdmFyID0gQHNvdXJjZS5jb21waWxlIG8sIExFVkVMX0xJU1RcbiAgICAgICAgICAgIGlmIChuYW1lIG9yIEBvd24pIGFuZCBAc291cmNlLnVud3JhcCgpIG5vdCBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsXG4gICAgICAgICAgICAgICAgZGVmUGFydCArPSBcIiN7QHRhYn0je3JlZiA9IHNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ30gPSAje3N2YXJ9O1xcblwiXG4gICAgICAgICAgICAgICAgc3ZhciA9IHJlZlxuICAgICAgICAgICAgaWYgbmFtZSBhbmQgbm90IEBwYXR0ZXJuIGFuZCBub3QgQGZyb21cbiAgICAgICAgICAgICAgICBuYW1lUGFydCA9IFwiI3tuYW1lfSA9ICN7c3Zhcn1bI3trdmFyfV1cIlxuICAgICAgICAgICAgaWYgbm90IEBvYmplY3QgYW5kIG5vdCBAZnJvbVxuICAgICAgICAgICAgICAgIGRlZlBhcnQgKz0gXCIje0B0YWJ9I3tzdGVwfTtcXG5cIiBpZiBzdGVwICE9IHN0ZXBWYXJcbiAgICAgICAgICAgICAgICBkb3duID0gc3RlcE51bSA8IDBcbiAgICAgICAgICAgICAgICBsdmFyID0gc2NvcGUuZnJlZVZhcmlhYmxlICdsZW4nIHVubGVzcyBAc3RlcCBhbmQgc3RlcE51bT8gYW5kIGRvd25cbiAgICAgICAgICAgICAgICBkZWNsYXJlID0gXCIje2t2YXJBc3NpZ259I3tpdmFyfSA9IDAsICN7bHZhcn0gPSAje3N2YXJ9Lmxlbmd0aFwiXG4gICAgICAgICAgICAgICAgZGVjbGFyZURvd24gPSBcIiN7a3ZhckFzc2lnbn0je2l2YXJ9ID0gI3tzdmFyfS5sZW5ndGggLSAxXCJcbiAgICAgICAgICAgICAgICBjb21wYXJlID0gXCIje2l2YXJ9IDwgI3tsdmFyfVwiXG4gICAgICAgICAgICAgICAgY29tcGFyZURvd24gPSBcIiN7aXZhcn0gPj0gMFwiXG4gICAgICAgICAgICAgICAgaWYgQHN0ZXBcbiAgICAgICAgICAgICAgICAgICAgaWYgc3RlcE51bT9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRvd25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wYXJlID0gY29tcGFyZURvd25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNsYXJlID0gZGVjbGFyZURvd25cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyZSA9IFwiI3tzdGVwVmFyfSA+IDAgPyAje2NvbXBhcmV9IDogI3tjb21wYXJlRG93bn1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVjbGFyZSA9IFwiKCN7c3RlcFZhcn0gPiAwID8gKCN7ZGVjbGFyZX0pIDogI3tkZWNsYXJlRG93bn0pXCJcbiAgICAgICAgICAgICAgICAgICAgaW5jcmVtZW50ID0gXCIje2l2YXJ9ICs9ICN7c3RlcFZhcn1cIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaW5jcmVtZW50ID0gXCIje2lmIGt2YXIgIT0gaXZhciB0aGVuIFwiKysje2l2YXJ9XCIgZWxzZSBcIiN7aXZhcn0rK1wifVwiXG4gICAgICAgICAgICAgICAgZm9yUGFydEZyYWdtZW50cyA9IFtAbWFrZUNvZGUoXCIje2RlY2xhcmV9OyAje2NvbXBhcmV9OyAje2t2YXJBc3NpZ259I3tpbmNyZW1lbnR9XCIpXVxuICAgICAgICBpZiBAcmV0dXJuc1xuICAgICAgICAgICAgcmVzdWx0UGFydCAgID0gXCIje0B0YWJ9I3tydmFyfSA9IFtdO1xcblwiXG4gICAgICAgICAgICByZXR1cm5SZXN1bHQgPSBcIlxcbiN7QHRhYn1yZXR1cm4gI3tydmFyfTtcIlxuICAgICAgICAgICAgYm9keS5tYWtlUmV0dXJuIHJ2YXJcbiAgICAgICAgaWYgQGd1YXJkXG4gICAgICAgICAgICBpZiBib2R5LmV4cHJlc3Npb25zLmxlbmd0aCA+IDFcbiAgICAgICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgbmV3IElmIChuZXcgUGFyZW5zIEBndWFyZCkuaW52ZXJ0KCksIG5ldyBTdGF0ZW1lbnRMaXRlcmFsIFwiY29udGludWVcIlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJvZHkgPSBCbG9jay53cmFwIFtuZXcgSWYgQGd1YXJkLCBib2R5XSBpZiBAZ3VhcmRcbiAgICAgICAgaWYgQHBhdHRlcm5cbiAgICAgICAgICAgIGJvZHkuZXhwcmVzc2lvbnMudW5zaGlmdCBuZXcgQXNzaWduIEBuYW1lLCBpZiBAZnJvbSB0aGVuIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBrdmFyIGVsc2UgbmV3IExpdGVyYWwgXCIje3N2YXJ9WyN7a3Zhcn1dXCJcbiAgICAgICAgZGVmUGFydEZyYWdtZW50cyA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoZGVmUGFydCksIEBwbHVja0RpcmVjdENhbGwobywgYm9keSlcbiAgICAgICAgdmFyUGFydCA9IFwiXFxuI3tpZHQxfSN7bmFtZVBhcnR9O1wiIGlmIG5hbWVQYXJ0XG4gICAgICAgIGlmIEBvYmplY3RcbiAgICAgICAgICAgIGZvclBhcnRGcmFnbWVudHMgPSBbQG1ha2VDb2RlKFwiI3trdmFyfSBpbiAje3N2YXJ9XCIpXVxuICAgICAgICAgICAgZ3VhcmRQYXJ0ID0gXCJcXG4je2lkdDF9aWYgKCEje3V0aWxpdHkgJ2hhc1Byb3AnLCBvfS5jYWxsKCN7c3Zhcn0sICN7a3Zhcn0pKSBjb250aW51ZTtcIiBpZiBAb3duXG4gICAgICAgIGVsc2UgaWYgQGZyb21cbiAgICAgICAgICAgIGZvclBhcnRGcmFnbWVudHMgPSBbQG1ha2VDb2RlKFwiI3trdmFyfSBvZiAje3N2YXJ9XCIpXVxuICAgICAgICBib2R5RnJhZ21lbnRzID0gYm9keS5jb21waWxlVG9GcmFnbWVudHMgbWVyZ2UobywgaW5kZW50OiBpZHQxKSwgTEVWRUxfVE9QXG4gICAgICAgIGlmIGJvZHlGcmFnbWVudHMgYW5kIGJvZHlGcmFnbWVudHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgYm9keUZyYWdtZW50cyA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJcXG5cIiksIGJvZHlGcmFnbWVudHMsIEBtYWtlQ29kZShcIlxcblwiKVxuICAgICAgICBbXS5jb25jYXQgZGVmUGFydEZyYWdtZW50cywgQG1ha2VDb2RlKFwiI3tyZXN1bHRQYXJ0IG9yICcnfSN7QHRhYn1mb3IgKFwiKSxcbiAgICAgICAgICAgIGZvclBhcnRGcmFnbWVudHMsIEBtYWtlQ29kZShcIikgeyN7Z3VhcmRQYXJ0fSN7dmFyUGFydH1cIiksIGJvZHlGcmFnbWVudHMsXG4gICAgICAgICAgICBAbWFrZUNvZGUoXCIje0B0YWJ9fSN7cmV0dXJuUmVzdWx0IG9yICcnfVwiKVxuXG4gICAgcGx1Y2tEaXJlY3RDYWxsOiAobywgYm9keSkgLT5cbiAgICAgICAgZGVmcyA9IFtdXG4gICAgICAgIGZvciBleHByLCBpZHggaW4gYm9keS5leHByZXNzaW9uc1xuICAgICAgICAgICAgZXhwciA9IGV4cHIudW53cmFwQWxsKClcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyBleHByIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICAgICAgdmFsID0gZXhwci52YXJpYWJsZT8udW53cmFwQWxsKClcbiAgICAgICAgICAgIGNvbnRpbnVlIHVubGVzcyAodmFsIGluc3RhbmNlb2YgQ29kZSkgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHZhbCBpbnN0YW5jZW9mIFZhbHVlIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwuYmFzZT8udW53cmFwQWxsKCkgaW5zdGFuY2VvZiBDb2RlIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwucHJvcGVydGllcy5sZW5ndGggaXMgMSBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsLnByb3BlcnRpZXNbMF0ubmFtZT8udmFsdWUgaW4gWydjYWxsJywgJ2FwcGx5J10pXG4gICAgICAgICAgICBmbiAgICAgID0gdmFsLmJhc2U/LnVud3JhcEFsbCgpIG9yIHZhbFxuICAgICAgICAgICAgcmVmICAgICA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnZm4nXG4gICAgICAgICAgICBiYXNlICAgID0gbmV3IFZhbHVlIHJlZlxuICAgICAgICAgICAgaWYgdmFsLmJhc2VcbiAgICAgICAgICAgICAgICBbdmFsLmJhc2UsIGJhc2VdID0gW2Jhc2UsIHZhbF1cbiAgICAgICAgICAgIGJvZHkuZXhwcmVzc2lvbnNbaWR4XSA9IG5ldyBDYWxsIGJhc2UsIGV4cHIuYXJnc1xuICAgICAgICAgICAgZGVmcyA9IGRlZnMuY29uY2F0IEBtYWtlQ29kZShAdGFiKSwgKG5ldyBBc3NpZ24ocmVmLCBmbikuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1RPUCkpLCBAbWFrZUNvZGUoJztcXG4nKVxuICAgICAgICBkZWZzXG5cbiMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICBcbiMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgQSBKYXZhU2NyaXB0ICpzd2l0Y2gqIHN0YXRlbWVudC4gQ29udmVydHMgaW50byBhIHJldHVybmFibGUgZXhwcmVzc2lvbiBvbi1kZW1hbmQuXG5cbmV4cG9ydHMuU3dpdGNoID0gY2xhc3MgU3dpdGNoIGV4dGVuZHMgQmFzZVxuICAgIEA6IChAc3ViamVjdCwgQGNhc2VzLCBAb3RoZXJ3aXNlKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnc3ViamVjdCcsICdjYXNlcycsICdvdGhlcndpc2UnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuXG4gICAganVtcHM6IChvID0ge2Jsb2NrOiB5ZXN9KSAtPlxuICAgICAgICBmb3IgW2NvbmRzLCBibG9ja10gaW4gQGNhc2VzXG4gICAgICAgICAgICByZXR1cm4ganVtcE5vZGUgaWYganVtcE5vZGUgPSBibG9jay5qdW1wcyBvXG4gICAgICAgIEBvdGhlcndpc2U/Lmp1bXBzIG9cblxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIHBhaXJbMV0ubWFrZVJldHVybiByZXMgZm9yIHBhaXIgaW4gQGNhc2VzXG4gICAgICAgIEBvdGhlcndpc2Ugb3I9IG5ldyBCbG9jayBbbmV3IExpdGVyYWwgJ3ZvaWQgMCddIGlmIHJlc1xuICAgICAgICBAb3RoZXJ3aXNlPy5tYWtlUmV0dXJuIHJlc1xuICAgICAgICB0aGlzXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGlkdDEgPSBvLmluZGVudCArIFRBQlxuICAgICAgICBpZHQyID0gby5pbmRlbnQgPSBpZHQxICsgVEFCXG4gICAgICAgIGZyYWdtZW50cyA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoQHRhYiArIFwic3dpdGNoIChcIiksXG4gICAgICAgICAgICAoaWYgQHN1YmplY3QgdGhlbiBAc3ViamVjdC5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pIGVsc2UgQG1ha2VDb2RlIFwiZmFsc2VcIiksXG4gICAgICAgICAgICBAbWFrZUNvZGUoXCIpIHtcXG5cIilcbiAgICAgICAgZm9yIFtjb25kaXRpb25zLCBibG9ja10sIGkgaW4gQGNhc2VzXG4gICAgICAgICAgICBmb3IgY29uZCBpbiBmbGF0dGVuIFtjb25kaXRpb25zXVxuICAgICAgICAgICAgICAgIGNvbmQgICAgPSBjb25kLmludmVydCgpIHVubGVzcyBAc3ViamVjdFxuICAgICAgICAgICAgICAgIGZyYWdtZW50cyA9IGZyYWdtZW50cy5jb25jYXQgQG1ha2VDb2RlKGlkdDEgKyBcImNhc2UgXCIpLCBjb25kLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9QQVJFTiksIEBtYWtlQ29kZShcIjpcXG5cIilcbiAgICAgICAgICAgIGZyYWdtZW50cyA9IGZyYWdtZW50cy5jb25jYXQgYm9keSwgQG1ha2VDb2RlKCdcXG4nKSBpZiAoYm9keSA9IGJsb2NrLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1ApLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGJyZWFrIGlmIGkgaXMgQGNhc2VzLmxlbmd0aCAtIDEgYW5kIG5vdCBAb3RoZXJ3aXNlXG4gICAgICAgICAgICBleHByID0gQGxhc3ROb25Db21tZW50IGJsb2NrLmV4cHJlc3Npb25zXG4gICAgICAgICAgICBjb250aW51ZSBpZiBleHByIGluc3RhbmNlb2YgUmV0dXJuIG9yIChleHByIGluc3RhbmNlb2YgTGl0ZXJhbCBhbmQgZXhwci5qdW1wcygpIGFuZCBleHByLnZhbHVlICE9ICdkZWJ1Z2dlcicpXG4gICAgICAgICAgICBmcmFnbWVudHMucHVzaCBjb25kLm1ha2VDb2RlKGlkdDIgKyAnYnJlYWs7XFxuJylcbiAgICAgICAgaWYgQG90aGVyd2lzZSBhbmQgQG90aGVyd2lzZS5leHByZXNzaW9ucy5sZW5ndGhcbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZShpZHQxICsgXCJkZWZhdWx0OlxcblwiKSwgKEBvdGhlcndpc2UuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1RPUCkuLi4sIEBtYWtlQ29kZShcIlxcblwiKVxuICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgQHRhYiArICd9J1xuICAgICAgICBmcmFnbWVudHNcblxuIyAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgMDAwMDAwICAgIFxuIyAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAwMDAgICAgICAgXG5cbiMgSWYvZWxzZSBzdGF0ZW1lbnRzLiBBY3RzIGFzIGFuIGV4cHJlc3Npb24gYnkgcHVzaGluZyBkb3duIHJlcXVlc3RlZCByZXR1cm5zIHRvIHRoZSBsYXN0IGxpbmUgb2YgZWFjaCBjbGF1c2UuXG4jXG4jIFNpbmdsZS1leHByZXNzaW9uICoqSWZzKiogYXJlIGNvbXBpbGVkIGludG8gY29uZGl0aW9uYWwgb3BlcmF0b3JzIGlmIHBvc3NpYmxlLFxuIyBiZWNhdXNlIHRlcm5hcmllcyBhcmUgYWxyZWFkeSBwcm9wZXIgZXhwcmVzc2lvbnMsIGFuZCBkb24ndCBuZWVkIGNvbnZlcnNpb24uXG5cbmV4cG9ydHMuSWYgPSBjbGFzcyBJZiBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBAOiAoY29uZGl0aW9uLCBAYm9keSwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICBAY29uZGl0aW9uID0gaWYgb3B0aW9ucy50eXBlIGlzICd1bmxlc3MnIHRoZW4gY29uZGl0aW9uLmludmVydCgpIGVsc2UgY29uZGl0aW9uXG4gICAgICAgIEBlbHNlQm9keSAgPSBudWxsXG4gICAgICAgIEBpc0NoYWluICAgPSBmYWxzZVxuICAgICAgICB7QHNvYWt9ICAgID0gb3B0aW9uc1xuXG4gICAgY2hpbGRyZW46IFsnY29uZGl0aW9uJywgJ2JvZHknLCAnZWxzZUJvZHknXVxuXG4gICAgYm9keU5vZGU6ICAgICAtPiBAYm9keT8udW53cmFwKClcbiAgICBlbHNlQm9keU5vZGU6IC0+IEBlbHNlQm9keT8udW53cmFwKClcblxuICAgICMgUmV3cml0ZSBhIGNoYWluIG9mICoqSWZzKiogdG8gYWRkIGEgZGVmYXVsdCBjYXNlIGFzIHRoZSBmaW5hbCAqZWxzZSouXG4gICAgXG4gICAgYWRkRWxzZTogKGVsc2VCb2R5KSAtPlxuICAgICAgICBpZiBAaXNDaGFpblxuICAgICAgICAgICAgQGVsc2VCb2R5Tm9kZSgpLmFkZEVsc2UgZWxzZUJvZHlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGlzQ2hhaW4gID0gZWxzZUJvZHkgaW5zdGFuY2VvZiBJZlxuICAgICAgICAgICAgQGVsc2VCb2R5ID0gQGVuc3VyZUJsb2NrIGVsc2VCb2R5XG4gICAgICAgICAgICBAZWxzZUJvZHkudXBkYXRlTG9jYXRpb25EYXRhSWZNaXNzaW5nIGVsc2VCb2R5LmxvY2F0aW9uRGF0YVxuICAgICAgICB0aGlzXG5cbiAgICAjIFRoZSAqKklmKiogb25seSBjb21waWxlcyBpbnRvIGEgc3RhdGVtZW50IGlmIGVpdGhlciBvZiBpdHMgYm9kaWVzIG5lZWRzXG4gICAgIyB0byBiZSBhIHN0YXRlbWVudC4gT3RoZXJ3aXNlIGEgY29uZGl0aW9uYWwgb3BlcmF0b3IgaXMgc2FmZS5cbiAgICBcbiAgICBpc1N0YXRlbWVudDogKG8pIC0+XG4gICAgICAgIG8/LmxldmVsIGlzIExFVkVMX1RPUCBvclxuICAgICAgICAgICAgQGJvZHlOb2RlKCkuaXNTdGF0ZW1lbnQobykgb3IgQGVsc2VCb2R5Tm9kZSgpPy5pc1N0YXRlbWVudChvKVxuXG4gICAganVtcHM6IChvKSAtPiBAYm9keS5qdW1wcyhvKSBvciBAZWxzZUJvZHk/Lmp1bXBzKG8pXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIGlmIEBpc1N0YXRlbWVudCBvIHRoZW4gQGNvbXBpbGVTdGF0ZW1lbnQgbyBlbHNlIEBjb21waWxlRXhwcmVzc2lvbiBvXG5cbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBAZWxzZUJvZHkgIG9yPSBuZXcgQmxvY2sgW25ldyBMaXRlcmFsICd2b2lkIDAnXSBpZiByZXNcbiAgICAgICAgQGJvZHkgICAgIGFuZD0gbmV3IEJsb2NrIFtAYm9keS5tYWtlUmV0dXJuIHJlc11cbiAgICAgICAgQGVsc2VCb2R5IGFuZD0gbmV3IEJsb2NrIFtAZWxzZUJvZHkubWFrZVJldHVybiByZXNdXG4gICAgICAgIHRoaXNcblxuICAgIGVuc3VyZUJsb2NrOiAobm9kZSkgLT5cbiAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIEJsb2NrIHRoZW4gbm9kZSBlbHNlIG5ldyBCbG9jayBbbm9kZV1cblxuICAgICMgQ29tcGlsZSB0aGUgYElmYCBhcyBhIHJlZ3VsYXIgKmlmLWVsc2UqIHN0YXRlbWVudC4gRmxhdHRlbmVkIGNoYWlucyBmb3JjZSBpbm5lciAqZWxzZSogYm9kaWVzIGludG8gc3RhdGVtZW50IGZvcm0uXG4gICAgY29tcGlsZVN0YXRlbWVudDogKG8pIC0+XG4gICAgICAgIGNoaWxkID0gZGVsIG8sICdjaGFpbkNoaWxkJ1xuICAgICAgICBcbiAgICAgICAgIyBjb21tZW50aW5nIHRoaXMgb3V0IGRvZXNuJ3QgYnJlYWsgYW55IHRlc3RzOiB3aGF0IHdhcyB0aGlzIHN1cHBvc2VkIHRvIGFjaGlldmU/IC4uLlxuICAgICAgICAjIGV4ZXEgID0gZGVsIG8sICdpc0V4aXN0ZW50aWFsRXF1YWxzJ1xuICAgICAgICAjIGlmIGV4ZXFcbiAgICAgICAgIyAgICAgcmV0dXJuIG5ldyBJZihAY29uZGl0aW9uLmludmVydCgpLCBAZWxzZUJvZHlOb2RlKCksIHR5cGU6ICdpZicpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICAgICAgaW5kZW50ID0gby5pbmRlbnQgKyBUQUJcbiAgICAgICAgY29uZCAgID0gQGNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfUEFSRU5cbiAgICAgICAgYm9keSAgID0gQGVuc3VyZUJsb2NrKEBib2R5KS5jb21waWxlVG9GcmFnbWVudHMgbWVyZ2Ugbywge2luZGVudH1cbiAgICAgICAgaWZQYXJ0ID0gW10uY29uY2F0IEBtYWtlQ29kZShcImlmIChcIiksIGNvbmQsIEBtYWtlQ29kZShcIikge1xcblwiKSwgYm9keSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifX1cIilcbiAgICAgICAgaWZQYXJ0LnVuc2hpZnQgQG1ha2VDb2RlIEB0YWIgdW5sZXNzIGNoaWxkXG4gICAgICAgIHJldHVybiBpZlBhcnQgdW5sZXNzIEBlbHNlQm9keVxuICAgICAgICBhbnN3ZXIgPSBpZlBhcnQuY29uY2F0IEBtYWtlQ29kZSgnIGVsc2UgJylcbiAgICAgICAgaWYgQGlzQ2hhaW5cbiAgICAgICAgICAgIG8uY2hhaW5DaGlsZCA9IHllc1xuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAZWxzZUJvZHkudW53cmFwKCkuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1RPUFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0IEBtYWtlQ29kZShcIntcXG5cIiksIEBlbHNlQm9keS5jb21waWxlVG9GcmFnbWVudHMobWVyZ2Uobywge2luZGVudH0pLCBMRVZFTF9UT1ApLCBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9fVwiKVxuICAgICAgICBhbnN3ZXJcblxuICAgICMgQ29tcGlsZSB0aGUgYElmYCBhcyBhIGNvbmRpdGlvbmFsIG9wZXJhdG9yLlxuICAgIGNvbXBpbGVFeHByZXNzaW9uOiAobykgLT5cbiAgICAgICAgY29uZCA9IEBjb25kaXRpb24uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0NPTkRcbiAgICAgICAgYm9keSA9IEBib2R5Tm9kZSgpLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIGFsdCAgPSBpZiBAZWxzZUJvZHlOb2RlKCkgdGhlbiBAZWxzZUJvZHlOb2RlKCkuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX0xJU1QpIGVsc2UgW0BtYWtlQ29kZSgndm9pZCAwJyldXG4gICAgICAgIGZyYWdtZW50cyA9IGNvbmQuY29uY2F0IEBtYWtlQ29kZShcIiA/IFwiKSwgYm9keSwgQG1ha2VDb2RlKFwiIDogXCIpLCBhbHRcbiAgICAgICAgaWYgby5sZXZlbCA+PSBMRVZFTF9DT05EIHRoZW4gQHdyYXBJbkJyYWNlcyBmcmFnbWVudHMgZWxzZSBmcmFnbWVudHNcblxuICAgIHVuZm9sZFNvYWs6IC0+XG4gICAgICAgIEBzb2FrIGFuZCB0aGlzXG5cbiMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG5cbmV4cG9ydHMuTWV0YUlmID0gY2xhc3MgTWV0YUlmIGV4dGVuZHMgQmFzZVxuICAgIFxuICAgIEA6IChAY29uZGl0aW9uLCBAYm9keSwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICBcbiAgICAgICAgQGVsc2VCb2R5ID0gbnVsbFxuICAgICAgICBAaXNDaGFpbiAgPSBmYWxzZVxuICAgICAgICB7IEBzb2FrIH0gPSBvcHRpb25zXG5cbiAgICBjaGlsZHJlbjogWydjb25kaXRpb24nLCAnYm9keScsICdlbHNlQm9keSddXG5cbiAgICAjIFJld3JpdGUgYSBjaGFpbiBvZiBJZnMgdG8gYWRkIGEgZGVmYXVsdCBjYXNlIGFzIHRoZSBmaW5hbCBlbHNlLlxuICAgIFxuICAgIGFkZEVsc2U6IChlbHNlQm9keSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBpc0NoYWluXG4gICAgICAgICAgICBAZWxzZUJvZHk/LnVud3JhcCgpLmFkZEVsc2UgZWxzZUJvZHlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGlzQ2hhaW4gID0gZWxzZUJvZHkgaW5zdGFuY2VvZiBNZXRhSWZcbiAgICAgICAgICAgIEBlbHNlQm9keSA9IEBlbnN1cmVCbG9jayBlbHNlQm9keVxuICAgICAgICAgICAgQGVsc2VCb2R5LnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBlbHNlQm9keS5sb2NhdGlvbkRhdGFcbiAgICAgICAgdGhpc1xuXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgXG4gICAgICAgIEBlbHNlQm9keSAgb3I9IG5ldyBCbG9jayBbbmV3IExpdGVyYWwgJ3ZvaWQgMCddIGlmIHJlc1xuICAgICAgICAjIEBib2R5ICAgICBhbmQ9IG5ldyBCbG9jayBbQGJvZHkubWFrZVJldHVybiByZXNdXG4gICAgICAgIEBlbHNlQm9keSBhbmQ9IG5ldyBCbG9jayBbQGVsc2VCb2R5Lm1ha2VSZXR1cm4gcmVzXVxuICAgICAgICB0aGlzXG4gICAgXG4gICAgIyBUaGUgSWYgb25seSBjb21waWxlcyBpbnRvIGEgc3RhdGVtZW50IGlmIGVpdGhlciBvZiBpdHMgYm9kaWVzIG5lZWRzXG4gICAgIyB0byBiZSBhIHN0YXRlbWVudC4gT3RoZXJ3aXNlIGEgY29uZGl0aW9uYWwgb3BlcmF0b3IgaXMgc2FmZS5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgICAgICAgIFxuICAgICAgICAjIGxvZyAnTWV0YUlmIGNvbXBpbGVTdGF0ZW1lbnQgQGNvbmRpdGlvblxcbicsIHN0cmluZ2lmeSBAY29uZGl0aW9uXG4gICAgICAgIFxuICAgICAgICBjb21waWxlTWV0YUlmIG5vZGU6QCwgb3B0czpvXG4gICAgICAgIFxuICAgIGVuc3VyZUJsb2NrOiAobm9kZSkgLT4gaWYgbm9kZSBpbnN0YW5jZW9mIEJsb2NrIHRoZW4gbm9kZSBlbHNlIG5ldyBCbG9jayBbbm9kZV1cbiAgICB1bmZvbGRTb2FrOiAtPiBAc29hayBhbmQgdGhpc1xuICAgIGp1bXBzOiAobykgLT4gQGJvZHkuanVtcHMobykgb3IgQGVsc2VCb2R5Py5qdW1wcyhvKVxuICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuXG5VVElMSVRJRVMgPVxuXG4gICAgIyBDb3JyZWN0bHkgc2V0IHVwIGEgcHJvdG90eXBlIGNoYWluIGZvciBpbmhlcml0YW5jZSwgaW5jbHVkaW5nIGEgcmVmZXJlbmNlXG4gICAgIyB0byB0aGUgc3VwZXJjbGFzcyBmb3IgYHN1cGVyKClgIGNhbGxzLCBhbmQgY29waWVzIG9mIGFueSBzdGF0aWMgcHJvcGVydGllcy5cbiAgICAgICAgXG4gICAgZXh0ZW5kOiAobykgLT4gXCJcbiAgICAgICAgZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHBhcmVudCkge1xuICAgICAgICAgICAgICAgIGlmICgje3V0aWxpdHkgJ2hhc1Byb3AnLCBvfS5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gY3RvcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gICAgICAgICAgICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpO1xuICAgICAgICAgICAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZDtcbiAgICAgICAgfVxuICAgIFwiXG5cbiAgICAjIENyZWF0ZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBjdXJyZW50IHZhbHVlIG9mIFwidGhpc1wiLlxuICAgIGJpbmQ6IC0+ICdcbiAgICAgICAgZnVuY3Rpb24oZm4sIG1lKXtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAnXG5cbiAgICAjIERpc2NvdmVyIGlmIGFuIGl0ZW0gaXMgaW4gYW4gYXJyYXkuXG4gICAgaW5kZXhPZjogLT4gXCJbXS5pbmRleE9mXCJcbiAgICAjIGluZGV4T2Y6IC0+IFwiXG4gICAgICAgICMgW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAjIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAjIGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgICAgICAgICAjIH1cbiAgICAgICAgICAgICMgcmV0dXJuIC0xO1xuICAgICAgICAjIH1cbiAgICAjIFwiXG5cbiAgICBtb2R1bG86IC0+IFwiXCJcIlxuICAgICAgICBmdW5jdGlvbihhLCBiKSB7IHJldHVybiAoK2EgJSAoYiA9ICtiKSArIGIpICUgYjsgfVxuICAgIFwiXCJcIlxuXG4gICAgIyBTaG9ydGN1dHMgdG8gc3BlZWQgdXAgdGhlIGxvb2t1cCB0aW1lIGZvciBuYXRpdmUgZnVuY3Rpb25zLlxuICAgIGhhc1Byb3A6IC0+ICd7fS5oYXNPd25Qcm9wZXJ0eSdcbiAgICBzbGljZTogLT4gJ1tdLnNsaWNlJyAjIGUuZy4gW1thXS4uLl1cblxuIyBMZXZlbHMgaW5kaWNhdGUgYSBub2RlJ3MgcG9zaXRpb24gaW4gdGhlIEFTVC4gVXNlZnVsIGZvciBrbm93aW5nIGlmXG4jIHBhcmVucyBhcmUgbmVjZXNzYXJ5IG9yIHN1cGVyZmx1b3VzLlxuTEVWRUxfVE9QICAgID0gMSAgICAjIC4uLjtcbkxFVkVMX1BBUkVOICA9IDIgICAgIyAoLi4uKVxuTEVWRUxfTElTVCAgID0gMyAgICAjIFsuLi5dXG5MRVZFTF9DT05EICAgPSA0ICAgICMgLi4uID8geCA6IHlcbkxFVkVMX09QICAgICA9IDUgICAgIyAhLi4uXG5MRVZFTF9BQ0NFU1MgPSA2ICAgICMgLi4uWzBdXG5cblRBQiA9ICcgICAgJyAjIFRhYnMgYXJlIDQgc3BhY2VzIGZvciBwcmV0dHkgcHJpbnRpbmcuXG5cblNJTVBMRU5VTSA9IC9eWystXT9cXGQrJC9cblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIEhlbHBlciBmb3IgZW5zdXJpbmcgdGhhdCB1dGlsaXR5IGZ1bmN0aW9ucyBhcmUgYXNzaWduZWQgYXQgdGhlIHRvcCBsZXZlbC5cbiAgICBcbnV0aWxpdHkgPSAobmFtZSwgbykgLT5cbiAgICB7cm9vdH0gPSBvLnNjb3BlXG4gICAgaWYgbmFtZSBvZiByb290LnV0aWxpdGllc1xuICAgICAgICByb290LnV0aWxpdGllc1tuYW1lXVxuICAgIGVsc2VcbiAgICAgICAgcmVmID0gcm9vdC5mcmVlVmFyaWFibGUgbmFtZVxuICAgICAgICByb290LmFzc2lnbiByZWYsIFVUSUxJVElFU1tuYW1lXSBvICMgPC0gYWRkcyB1dGlsaXR5IHRvIHRvcCBsZXZlbCBzY29wZVxuICAgICAgICByb290LnV0aWxpdGllc1tuYW1lXSA9IHJlZlxuXG5tdWx0aWRlbnQgPSAoY29kZSwgdGFiKSAtPlxuICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UgL1xcbi9nLCAnJCYnICsgdGFiXG4gICAgY29kZS5yZXBsYWNlIC9cXHMrJC8sICcnXG5cbmlzTGl0ZXJhbEFyZ3VtZW50cyA9IChub2RlKSAtPlxuICAgIG5vZGUgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCBhbmQgbm9kZS52YWx1ZSBpcyAnYXJndW1lbnRzJ1xuXG5pc0xpdGVyYWxUaGlzID0gKG5vZGUpIC0+XG4gICAgbm9kZSBpbnN0YW5jZW9mIFRoaXNMaXRlcmFsIG9yXG4gICAgICAgIChub2RlIGluc3RhbmNlb2YgQ29kZSBhbmQgbm9kZS5ib3VuZCkgb3JcbiAgICAgICAgbm9kZSBpbnN0YW5jZW9mIFN1cGVyQ2FsbFxuXG5pc0NvbXBsZXhPckFzc2lnbmFibGUgPSAobm9kZSkgLT4gbm9kZS5pc0NvbXBsZXgoKSBvciBub2RlLmlzQXNzaWduYWJsZT8oKVxuXG4jIFVuZm9sZCBhIG5vZGUncyBjaGlsZCBpZiBzb2FrLCB0aGVuIHR1Y2sgdGhlIG5vZGUgdW5kZXIgY3JlYXRlZCBgSWZgXG5cbnVuZm9sZFNvYWsgPSAobywgcGFyZW50LCBuYW1lKSAtPlxuICAgIHJldHVybiB1bmxlc3MgaWZuID0gcGFyZW50W25hbWVdLnVuZm9sZFNvYWsgb1xuICAgIHBhcmVudFtuYW1lXSA9IGlmbi5ib2R5XG4gICAgaWZuLmJvZHkgPSBuZXcgVmFsdWUgcGFyZW50XG4gICAgaWZuXG4iXX0=
//# sourceURL=../coffee/nodes.coffee