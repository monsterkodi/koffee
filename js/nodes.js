
/*
000   000   0000000   0000000    00000000   0000000  
0000  000  000   000  000   000  000       000       
000 0 000  000   000  000   000  0000000   0000000   
000  0000  000   000  000   000  000            000  
000   000   0000000   0000000    00000000  0000000
 */
var Access, Arr, Assign, Base, Block, BooleanLiteral, Call, Class, Code, CodeFragment, Comment, Existence, Expansion, ExportAllDeclaration, ExportDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier, ExportSpecifierList, Extends, For, IdentifierLiteral, If, ImportClause, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, ImportSpecifierList, In, Index, InfinityLiteral, JS_FORBIDDEN, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, ModuleDeclaration, ModuleSpecifier, ModuleSpecifierList, NEGATE, NO, NaNLiteral, NullLiteral, NumberLiteral, Obj, Op, Param, Parens, PassthroughLiteral, PropertyName, Range, RegexLiteral, RegexWithInterpolations, Return, SIMPLENUM, Scope, Slice, Splat, StatementLiteral, StringLiteral, StringWithInterpolations, SuperCall, Switch, TAB, THIS, TaggedTemplateCall, ThisLiteral, Throw, Try, UTILITIES, UndefinedLiteral, Value, While, YES, YieldReturn, addLocationDataFn, compact, del, ends, extend, flatten, fragmentsToText, isComplexOrAssignable, isLiteralArguments, isLiteralThis, isUnassignable, locationDataToString, log, merge, multident, ref1, ref2, some, starts, throwSyntaxError, unfoldSoak, utility,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

Error.stackTraceLimit = 2e308;

log = console.log;

Scope = require('./scope').Scope;

ref1 = require('./lexer'), isUnassignable = ref1.isUnassignable, JS_FORBIDDEN = ref1.JS_FORBIDDEN;

ref2 = require('./helpers'), compact = ref2.compact, flatten = ref2.flatten, extend = ref2.extend, merge = ref2.merge, del = ref2.del, starts = ref2.starts, ends = ref2.ends, some = ref2.some, addLocationDataFn = ref2.addLocationDataFn, locationDataToString = ref2.locationDataToString, throwSyntaxError = ref2.throwSyntaxError;

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

fragmentsToText = function(fragments) {
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

exports.Base = Base = (function() {
    function Base() {}

    Base.prototype.compile = function(o, lvl) {
        return fragmentsToText(this.compileToFragments(o, lvl));
    };

    Base.prototype.compileToFragments = function(o, lvl) {
        var node;
        o = extend({}, o);
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
        return [fragmentsToText(cacheValues[0]), fragmentsToText(cacheValues[1])];
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
        if (props.length && SIMPLENUM.test(fragmentsToText(fragments))) {
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
            if (SIMPLENUM.test(fragmentsToText(fun))) {
                fun = this.wrapInBraces(fun);
            }
            if (name) {
                ref = fragmentsToText(fun);
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
            return this.error('cannot call super outside of an instance method.');
        }
    };

    SuperCall.prototype.superThis = function(o) {
        var method;
        method = o.scope.method;
        return (method && !method.klass && method.context) || "this";
    };

    SuperCall.prototype.compileSplat = function(o, splatArgs) {
        if (splatArgs.length === 1 && splatArgs[0].code === 'arguments' && (this.configParameter != null) && o.feature['config-parameters']) {
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
            var n, t;
            n = obj.variable.base.value;
            t = obj.value.variable["this"] && 'this.' || '';
            return n + ":" + (t + n);
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
            body = fragmentsToText(this.compileNode(o));
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
            compiledText = fragmentsToText(compiled);
            if (!(!this.range.exclusive && +compiledText === -1)) {
                toStr = ', ' + (this.range.exclusive ? compiledText : to.isNumber() ? "" + (+compiledText + 1) : (compiled = to.compileToFragments(o, LEVEL_ACCESS), "+" + (fragmentsToText(compiled)) + " + 1 || 9e9"));
            }
        }
        return [this.makeCode(".slice(" + (fragmentsToText(fromCompiled)) + (toStr || '') + ")")];
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
        if (fragmentsToText(answer).indexOf('\n') >= 0) {
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
                    if (child.classBody && o.feature['config-parameters']) {
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
                    return log('CONSTRUCTOR PARAM0 NOT AN OBJ?');
                }
                if (!expr.body instanceof Block) {
                    return log('CONSTRUCTOR BODY NOT AN BLOCK?');
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
            if (ref8 = fragmentsToText(compiledName), indexOf.call(JS_FORBIDDEN, ref8) >= 0) {
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
        vvarText = fragmentsToText(vvar);
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
            o.scope.parameter(fragmentsToText(params[i]));
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
        if (fragmentsToText(sub) === fragmentsToText(ref)) {
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
        var answer, body, child, cond, exeq, ifPart, indent;
        child = del(o, 'chainChild');
        exeq = del(o, 'isExistentialEquals');
        if (exeq) {
            return new If(this.condition.invert(), this.elseBodyNode(), {
                type: 'if'
            }).compileToFragments(o);
        }
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

UTILITIES = {
    extend: function(o) {
        return "function(child, parent) { for (var key in parent) { if (" + (utility('hasProp', o)) + ".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
    },
    bind: function() {
        return 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }';
    },
    indexOf: function() {
        return "[].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }";
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztBQUFBLElBQUEsMnNDQUFBO0lBQUE7Ozs7O0FBYUEsS0FBSyxDQUFDLGVBQU4sR0FBd0I7O0FBQ3hCLEdBQUEsR0FBTSxPQUFPLENBQUM7O0FBRWIsUUFBUyxPQUFBLENBQVEsU0FBUjs7QUFDVixPQUFpQyxPQUFBLENBQVEsU0FBUixDQUFqQyxFQUFDLG9DQUFELEVBQWlCOztBQUdqQixPQUM2RCxPQUFBLENBQVEsV0FBUixDQUQ3RCxFQUFDLHNCQUFELEVBQVUsc0JBQVYsRUFBbUIsb0JBQW5CLEVBQTJCLGtCQUEzQixFQUFrQyxjQUFsQyxFQUF1QyxvQkFBdkMsRUFBK0MsZ0JBQS9DLEVBQXFELGdCQUFyRCxFQUNBLDBDQURBLEVBQ21CLGdEQURuQixFQUN5Qzs7QUFHekMsT0FBTyxDQUFDLE1BQVIsR0FBaUI7O0FBQ2pCLE9BQU8sQ0FBQyxpQkFBUixHQUE0Qjs7QUFHNUIsR0FBQSxHQUFVLFNBQUE7V0FBRztBQUFIOztBQUNWLEVBQUEsR0FBVSxTQUFBO1dBQUc7QUFBSDs7QUFDVixJQUFBLEdBQVUsU0FBQTtXQUFHO0FBQUg7O0FBQ1YsTUFBQSxHQUFVLFNBQUE7SUFBRyxJQUFDLENBQUEsT0FBRCxHQUFXLENBQUksSUFBQyxDQUFBO1dBQVM7QUFBNUI7O0FBYVYsT0FBTyxDQUFDLFlBQVIsR0FBNkI7SUFFdEIsc0JBQUMsTUFBRCxFQUFTLElBQVQ7QUFFQyxZQUFBO1FBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxFQUFBLEdBQUc7UUFDWCxJQUFDLENBQUEsWUFBRCxvQkFBZ0IsTUFBTSxDQUFFO1FBQ3hCLElBQUMsQ0FBQSxJQUFELCtEQUEyQixDQUFFLHVCQUFyQixJQUE2QjtJQUp0Qzs7MkJBTUgsUUFBQSxHQUFVLFNBQUE7ZUFFTixFQUFBLEdBQUcsSUFBQyxDQUFBLElBQUosR0FBVSxDQUFJLElBQUMsQ0FBQSxZQUFKLEdBQXNCLElBQUEsR0FBTyxvQkFBQSxDQUFxQixJQUFDLENBQUEsWUFBdEIsQ0FBN0IsR0FBc0UsRUFBdkU7SUFGSjs7Ozs7O0FBSWQsZUFBQSxHQUFrQixTQUFDLFNBQUQ7QUFFZCxRQUFBO1dBQUE7O0FBQUM7YUFBQSw2Q0FBQTs7eUJBQUEsUUFBUSxDQUFDO0FBQVQ7O1FBQUQsQ0FBeUMsQ0FBQyxJQUExQyxDQUErQyxFQUEvQztBQUZjOztBQW9CbEIsT0FBTyxDQUFDLElBQVIsR0FBcUI7OzttQkFFakIsT0FBQSxHQUFTLFNBQUMsQ0FBRCxFQUFJLEdBQUo7ZUFDTCxlQUFBLENBQWdCLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixDQUFwQixFQUF1QixHQUF2QixDQUFoQjtJQURLOzttQkFVVCxrQkFBQSxHQUFvQixTQUFDLENBQUQsRUFBSSxHQUFKO0FBRWhCLFlBQUE7UUFBQSxDQUFBLEdBQVcsTUFBQSxDQUFPLEVBQVAsRUFBVyxDQUFYO1FBQ1gsSUFBa0IsR0FBbEI7WUFBQSxDQUFDLENBQUMsS0FBRixHQUFXLElBQVg7O1FBQ0EsSUFBQSxHQUFXLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWixDQUFBLElBQWtCO1FBQzdCLElBQUksQ0FBQyxHQUFMLEdBQVcsQ0FBQyxDQUFDO1FBQ2IsSUFBRyxDQUFDLENBQUMsS0FBRixLQUFXLFNBQVgsSUFBd0IsQ0FBSSxJQUFJLENBQUMsV0FBTCxDQUFpQixDQUFqQixDQUEvQjttQkFDSSxJQUFJLENBQUMsV0FBTCxDQUFpQixDQUFqQixFQURKO1NBQUEsTUFBQTttQkFHSSxJQUFJLENBQUMsY0FBTCxDQUFvQixDQUFwQixFQUhKOztJQU5nQjs7bUJBY3BCLGNBQUEsR0FBZ0IsU0FBQyxDQUFEO0FBRVosWUFBQTtRQUFBLElBQUcsUUFBQSxHQUFXLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBZDtZQUNJLFFBQVEsQ0FBQyxLQUFULENBQWUsOENBQWYsRUFESjs7UUFFQSxDQUFDLENBQUMsV0FBRixHQUFnQjtRQUNoQixJQUFBLEdBQU8sSUFBSSxJQUFKLENBQVMsRUFBVCxFQUFhLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBQyxJQUFELENBQVgsQ0FBYjtRQUNQLElBQUEsR0FBTztRQUNQLElBQUcsQ0FBQyxhQUFBLEdBQWdCLElBQUMsQ0FBQSxRQUFELENBQVUsa0JBQVYsQ0FBakIsQ0FBQSxJQUFrRCxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsQ0FBckQ7WUFDSSxJQUFBLEdBQU8sQ0FBQyxJQUFJLFdBQUw7WUFDUCxJQUFHLGFBQUg7Z0JBQ0ksSUFBQSxHQUFPO2dCQUNQLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBSSxpQkFBSixDQUFzQixXQUF0QixDQUFWLEVBRko7YUFBQSxNQUFBO2dCQUlJLElBQUEsR0FBTyxPQUpYOztZQUtBLElBQUEsR0FBTyxJQUFJLEtBQUosQ0FBVSxJQUFWLEVBQWdCLENBQUMsSUFBSSxNQUFKLENBQVcsSUFBSSxZQUFKLENBQWlCLElBQWpCLENBQVgsQ0FBRCxDQUFoQixFQVBYOztRQVFBLEtBQUEsR0FBUSxDQUFDLElBQUksSUFBSixDQUFTLElBQVQsRUFBZSxJQUFmLENBQUQsQ0FBcUIsQ0FBQyxXQUF0QixDQUFrQyxDQUFsQztRQUNSLElBQUcsSUFBSSxDQUFDLFdBQUwsc0NBQTZCLENBQUUscUJBQWxDO1lBQ0ksS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFDLENBQUEsUUFBRCxDQUFVLFVBQVYsQ0FBZDtZQUNBLEtBQUssQ0FBQyxJQUFOLENBQWMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBQWQsRUFGSjs7ZUFHQTtJQW5CWTs7bUJBNkJoQixLQUFBLEdBQU8sU0FBQyxDQUFELEVBQUksS0FBSixFQUFXLFNBQVg7QUFFSCxZQUFBO1FBQUEsT0FBQSxHQUFhLGlCQUFILEdBQW1CLFNBQUEsQ0FBVSxJQUFWLENBQW5CLEdBQXVDLElBQUMsQ0FBQSxTQUFELENBQUE7UUFDakQsSUFBRyxPQUFIO1lBQ0ksR0FBQSxHQUFNLElBQUksaUJBQUosQ0FBc0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFSLENBQXFCLEtBQXJCLENBQXRCO1lBQ04sR0FBQSxHQUFNLElBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBaEI7WUFDTixJQUFHLEtBQUg7dUJBQWMsQ0FBQyxHQUFHLENBQUMsa0JBQUosQ0FBdUIsQ0FBdkIsRUFBMEIsS0FBMUIsQ0FBRCxFQUFtQyxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBRyxDQUFDLEtBQWQsQ0FBRCxDQUFuQyxFQUFkO2FBQUEsTUFBQTt1QkFBOEUsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUE5RTthQUhKO1NBQUEsTUFBQTtZQUtJLEdBQUEsR0FBUyxLQUFILEdBQWMsSUFBQyxDQUFBLGtCQUFELENBQW9CLENBQXBCLEVBQXVCLEtBQXZCLENBQWQsR0FBZ0Q7bUJBQ3RELENBQUMsR0FBRCxFQUFNLEdBQU4sRUFOSjs7SUFIRzs7bUJBV1Asb0JBQUEsR0FBc0IsU0FBQyxXQUFEO2VBRWxCLENBQUMsZUFBQSxDQUFnQixXQUFZLENBQUEsQ0FBQSxDQUE1QixDQUFELEVBQWtDLGVBQUEsQ0FBZ0IsV0FBWSxDQUFBLENBQUEsQ0FBNUIsQ0FBbEM7SUFGa0I7O21CQVF0QixVQUFBLEdBQVksU0FBQyxHQUFEO0FBQ1IsWUFBQTtRQUFBLEVBQUEsR0FBSyxJQUFDLENBQUEsU0FBRCxDQUFBO1FBQ0wsSUFBRyxHQUFIO21CQUNJLElBQUksSUFBSixDQUFTLElBQUksT0FBSixDQUFlLEdBQUQsR0FBSyxPQUFuQixDQUFULEVBQXFDLENBQUMsRUFBRCxDQUFyQyxFQURKO1NBQUEsTUFBQTttQkFHSSxJQUFJLE1BQUosQ0FBVyxFQUFYLEVBSEo7O0lBRlE7O21CQVlaLFFBQUEsR0FBVSxTQUFDLElBQUQ7QUFDTixZQUFBO1FBQUEsSUFBQSxHQUFPO1FBQ1AsSUFBQyxDQUFBLGdCQUFELENBQWtCLEtBQWxCLEVBQXNCLFNBQUMsQ0FBRDtZQUNsQixJQUFHLElBQUEsQ0FBSyxDQUFMLENBQUg7Z0JBQ0ksSUFBQSxHQUFPO0FBQ1AsdUJBQU8sTUFGWDs7UUFEa0IsQ0FBdEI7ZUFJQTtJQU5NOzttQkFRVixjQUFBLEdBQWdCLFNBQUMsSUFBRDtBQUNaLFlBQUE7UUFBQSxDQUFBLEdBQUksSUFBSSxDQUFDO0FBQ00sZUFBTSxDQUFBLEVBQU47Z0JBQWUsQ0FBQSxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUwsWUFBdUIsT0FBdkI7QUFBOUIsdUJBQU8sSUFBSyxDQUFBLENBQUE7O1FBQUc7ZUFDZjtJQUhZOzttQkFRaEIsUUFBQSxHQUFVLFNBQUMsR0FBRCxFQUFXLElBQVg7QUFDTixZQUFBOztZQURPLE1BQU07OztZQUFJLE9BQU8sSUFBQyxDQUFBLFdBQVcsQ0FBQzs7UUFDckMsSUFBQSxHQUFPLElBQUEsR0FBTyxHQUFQLEdBQWE7UUFDcEIsSUFBZSxJQUFDLENBQUEsSUFBaEI7WUFBQSxJQUFBLElBQVEsSUFBUjs7UUFDQSxJQUFDLENBQUEsU0FBRCxDQUFXLFNBQUMsSUFBRDttQkFBVSxJQUFBLElBQVEsSUFBSSxDQUFDLFFBQUwsQ0FBYyxHQUFBLEdBQU0sR0FBcEI7UUFBbEIsQ0FBWDtlQUNBO0lBSk07O21CQVFWLFNBQUEsR0FBVyxTQUFDLElBQUQ7QUFDUCxZQUFBO1FBQUEsSUFBQSxDQUFtQixJQUFDLENBQUEsUUFBcEI7QUFBQSxtQkFBTyxLQUFQOztBQUNBO0FBQUEsYUFBQSx3Q0FBQTs7Z0JBQTJCLElBQUUsQ0FBQSxJQUFBO0FBQ3pCO0FBQUEscUJBQUEsd0NBQUE7O29CQUNJLElBQWUsSUFBQSxDQUFLLEtBQUwsQ0FBQSxLQUFlLEtBQTlCO0FBQUEsK0JBQU8sS0FBUDs7QUFESjs7QUFESjtlQUdBO0lBTE87O21CQU9YLGdCQUFBLEdBQWtCLFNBQUMsVUFBRCxFQUFhLElBQWI7ZUFFZCxJQUFDLENBQUEsU0FBRCxDQUFXLFNBQUMsS0FBRDtBQUNQLGdCQUFBO1lBQUEsS0FBQSxHQUFRLElBQUEsQ0FBSyxLQUFMO1lBQ1IsSUFBZ0QsS0FBQSxLQUFTLEtBQXpEO3VCQUFBLEtBQUssQ0FBQyxnQkFBTixDQUF1QixVQUF2QixFQUFtQyxJQUFuQyxFQUFBOztRQUZPLENBQVg7SUFGYzs7bUJBTWxCLE1BQUEsR0FBUSxTQUFBO2VBQ0osSUFBSSxFQUFKLENBQU8sR0FBUCxFQUFZLElBQVo7SUFESTs7bUJBR1IsU0FBQSxHQUFXLFNBQUE7QUFDUCxZQUFBO1FBQUEsSUFBQSxHQUFPO0FBQ0UsZUFBTSxJQUFBLEtBQVEsQ0FBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFQLENBQWQ7QUFBVDtRQUFTO2VBQ1Q7SUFITzs7bUJBUVgsUUFBQSxHQUFjOzttQkFDZCxXQUFBLEdBQWM7O21CQUNkLEtBQUEsR0FBYzs7bUJBQ2QsU0FBQSxHQUFjOzttQkFDZCxXQUFBLEdBQWM7O21CQUNkLFlBQUEsR0FBYzs7bUJBQ2QsUUFBQSxHQUFjOzttQkFDZCxNQUFBLEdBQWM7O21CQUNkLFVBQUEsR0FBYzs7bUJBRWQsT0FBQSxHQUFjOzttQkFLZCwyQkFBQSxHQUE2QixTQUFDLFlBQUQ7UUFDekIsSUFBZSxJQUFDLENBQUEsWUFBaEI7QUFBQSxtQkFBTyxLQUFQOztRQUNBLElBQUMsQ0FBQSxZQUFELEdBQWdCO2VBRWhCLElBQUMsQ0FBQSxTQUFELENBQVcsU0FBQyxLQUFEO21CQUNQLEtBQUssQ0FBQywyQkFBTixDQUFrQyxZQUFsQztRQURPLENBQVg7SUFKeUI7O21CQU83QixLQUFBLEdBQU8sU0FBQyxPQUFEO2VBRUgsZ0JBQUEsQ0FBaUIsT0FBakIsRUFBMEIsSUFBQyxDQUFBLFlBQTNCO0lBRkc7O21CQUlQLFFBQUEsR0FBVSxTQUFDLElBQUQ7ZUFDTixJQUFJLFlBQUosQ0FBaUIsSUFBakIsRUFBdUIsSUFBdkI7SUFETTs7bUJBR1YsWUFBQSxHQUFjLFNBQUMsU0FBRDtlQUNWLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBQVYsRUFBMEIsU0FBMUIsRUFBcUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBQXJDO0lBRFU7O21CQU9kLGtCQUFBLEdBQW9CLFNBQUMsYUFBRCxFQUFnQixPQUFoQjtBQUNoQixZQUFBO1FBQUEsTUFBQSxHQUFTO0FBQ1QsYUFBQSx5REFBQTs7WUFDSSxJQUFHLENBQUg7Z0JBQVUsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLE9BQVYsQ0FBWixFQUFWOztZQUNBLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLFNBQWQ7QUFGYjtlQUdBO0lBTGdCOzs7Ozs7QUFpQnhCLE9BQU8sQ0FBQyxLQUFSLEdBQXNCOzs7SUFFTCxlQUFDLEtBQUQ7UUFFVCxJQUFDLENBQUEsV0FBRCxHQUFlLE9BQUEsQ0FBUSxPQUFBLENBQVEsS0FBQSxJQUFTLEVBQWpCLENBQVI7SUFGTjs7b0JBSWIsUUFBQSxHQUFVLENBQUMsYUFBRDs7b0JBRVYsSUFBQSxHQUFNLFNBQUMsSUFBRDtRQUVGLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFrQixJQUFsQjtlQUNBO0lBSEU7O29CQUtOLEdBQUEsR0FBSyxTQUFBO2VBRUQsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQUE7SUFGQzs7b0JBSUwsT0FBQSxHQUFTLFNBQUMsSUFBRDtRQUVMLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixJQUFyQjtlQUNBO0lBSEs7O29CQU9ULE1BQUEsR0FBUSxTQUFBO1FBQ0osSUFBRyxJQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIsS0FBdUIsQ0FBMUI7bUJBQWlDLElBQUMsQ0FBQSxXQUFZLENBQUEsQ0FBQSxFQUE5QztTQUFBLE1BQUE7bUJBQXNELEtBQXREOztJQURJOztvQkFHUixPQUFBLEdBQVMsU0FBQTtlQUNMLENBQUksSUFBQyxDQUFBLFdBQVcsQ0FBQztJQURaOztvQkFHVCxXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtBQUFBO0FBQUEsYUFBQSx3Q0FBQTs7Z0JBQTZCLEdBQUcsQ0FBQyxXQUFKLENBQWdCLENBQWhCO0FBQ3pCLHVCQUFPOztBQURYO2VBRUE7SUFIUzs7b0JBS2IsS0FBQSxHQUFPLFNBQUMsQ0FBRDtBQUNILFlBQUE7QUFBQTtBQUFBLGFBQUEsd0NBQUE7O1lBQ0ksSUFBbUIsUUFBQSxHQUFXLEdBQUcsQ0FBQyxLQUFKLENBQVUsQ0FBVixDQUE5QjtBQUFBLHVCQUFPLFNBQVA7O0FBREo7SUFERzs7b0JBT1AsVUFBQSxHQUFZLFNBQUMsR0FBRDtBQUVSLFlBQUE7UUFBQSxHQUFBLEdBQU0sSUFBQyxDQUFBLFdBQVcsQ0FBQztBQUNuQixlQUFNLEdBQUEsRUFBTjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsV0FBWSxDQUFBLEdBQUE7WUFDcEIsSUFBRyxDQUFBLENBQUEsSUFBQSxZQUFvQixPQUFwQixDQUFIO2dCQUNJLElBQUMsQ0FBQSxXQUFZLENBQUEsR0FBQSxDQUFiLEdBQW9CLElBQUksQ0FBQyxVQUFMLENBQWdCLEdBQWhCO2dCQUNwQixJQUErQixJQUFBLFlBQWdCLE1BQWhCLElBQTJCLENBQUksSUFBSSxDQUFDLFVBQW5FO29CQUFBLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBYixDQUFvQixHQUFwQixFQUF5QixDQUF6QixFQUFBOztBQUNBLHNCQUhKOztRQUZKO2VBTUE7SUFUUTs7b0JBYVosa0JBQUEsR0FBb0IsU0FBQyxDQUFELEVBQVMsS0FBVDs7WUFBQyxJQUFJOztRQUNyQixJQUFHLENBQUMsQ0FBQyxLQUFMO21CQUFnQiw4Q0FBTSxDQUFOLEVBQVMsS0FBVCxFQUFoQjtTQUFBLE1BQUE7bUJBQW9DLElBQUMsQ0FBQSxXQUFELENBQWEsQ0FBYixFQUFwQzs7SUFEZ0I7O29CQU9wQixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBRVQsWUFBQTtRQUFBLElBQUMsQ0FBQSxHQUFELEdBQVUsQ0FBQyxDQUFDO1FBQ1osR0FBQSxHQUFVLENBQUMsQ0FBQyxLQUFGLEtBQVc7UUFDckIsYUFBQSxHQUFnQjtBQUVoQjtBQUFBLGFBQUEsd0RBQUE7O1lBRUksSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFMLENBQUE7WUFDUCxJQUFBLEdBQVEsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBQSxJQUFzQjtZQUM5QixJQUFHLElBQUEsWUFBZ0IsS0FBbkI7Z0JBR0ksYUFBYSxDQUFDLElBQWQsQ0FBbUIsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsQ0FBakIsQ0FBbkIsRUFISjthQUFBLE1BSUssSUFBRyxHQUFIO2dCQUNELElBQUksQ0FBQyxLQUFMLEdBQWE7Z0JBQ2IsU0FBQSxHQUFZLElBQUksQ0FBQyxrQkFBTCxDQUF3QixDQUF4QjtnQkFDWixJQUFBLENBQU8sSUFBSSxDQUFDLFdBQUwsQ0FBaUIsQ0FBakIsQ0FBUDtvQkFDSSxTQUFTLENBQUMsT0FBVixDQUFrQixJQUFDLENBQUEsUUFBRCxDQUFVLEVBQUEsR0FBRyxJQUFDLENBQUEsR0FBZCxDQUFsQjtvQkFDQSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFmLEVBRko7O2dCQUdBLGFBQWEsQ0FBQyxJQUFkLENBQW1CLFNBQW5CLEVBTkM7YUFBQSxNQUFBO2dCQVFELGFBQWEsQ0FBQyxJQUFkLENBQW1CLElBQUksQ0FBQyxrQkFBTCxDQUF3QixDQUF4QixFQUEyQixVQUEzQixDQUFuQixFQVJDOztBQVJUO1FBaUJBLElBQUcsR0FBSDtZQUNJLElBQUcsSUFBQyxDQUFBLE1BQUo7QUFDSSx1QkFBTyxFQUFFLENBQUMsTUFBSCxDQUFVLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixhQUFwQixFQUFtQyxNQUFuQyxDQUFWLEVBQXNELElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUF0RCxFQURYO2FBQUEsTUFBQTtBQUdJLHVCQUFPLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixhQUFwQixFQUFtQyxJQUFuQyxFQUhYO2FBREo7O1FBS0EsSUFBRyxhQUFhLENBQUMsTUFBakI7WUFDSSxNQUFBLEdBQVMsSUFBQyxDQUFBLGtCQUFELENBQW9CLGFBQXBCLEVBQW1DLElBQW5DLEVBRGI7U0FBQSxNQUFBO1lBR0ksTUFBQSxHQUFTLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxRQUFWLENBQUQsRUFIYjs7UUFJQSxJQUFHLGFBQWEsQ0FBQyxNQUFkLEdBQXVCLENBQXZCLElBQTZCLENBQUMsQ0FBQyxLQUFGLElBQVcsVUFBM0M7bUJBQTJELElBQUMsQ0FBQSxZQUFELENBQWMsTUFBZCxFQUEzRDtTQUFBLE1BQUE7bUJBQXFGLE9BQXJGOztJQWhDUzs7b0JBdUNiLFdBQUEsR0FBYSxTQUFDLENBQUQ7QUFFVCxZQUFBO1FBQUEsQ0FBQyxDQUFDLE1BQUYsR0FBYyxDQUFDLENBQUMsSUFBTCxHQUFlLEVBQWYsR0FBdUI7UUFDbEMsQ0FBQyxDQUFDLEtBQUYsR0FBVztRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVc7UUFDWCxDQUFDLENBQUMsS0FBRixHQUFXLElBQUksS0FBSixDQUFVLElBQVYsRUFBZ0IsSUFBaEIsRUFBc0IsSUFBdEIsNkNBQStDLEVBQS9DO0FBSVg7QUFBQSxhQUFBLHdDQUFBOztZQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUixDQUFrQixJQUFsQjtBQUFBO1FBQ0EsT0FBQSxHQUFVO1FBQ1YsSUFBRyxDQUFJLENBQUMsQ0FBQyxJQUFUO1lBQ0ksV0FBQTs7QUFBYztBQUFBO3FCQUFBLGdEQUFBOztvQkFDVixJQUFBLENBQUEsQ0FBYSxHQUFHLENBQUMsTUFBSixDQUFBLENBQUEsWUFBd0IsT0FBckMsQ0FBQTtBQUFBLDhCQUFBOztpQ0FDQTtBQUZVOzs7WUFHZCxJQUFBLEdBQU8sSUFBQyxDQUFBLFdBQVk7WUFDcEIsSUFBQyxDQUFBLFdBQUQsR0FBZTtZQUNmLElBQUcsV0FBVyxDQUFDLE1BQWY7Z0JBQ0ksT0FBQSxHQUFVLElBQUMsQ0FBQSxXQUFELENBQWEsS0FBQSxDQUFNLENBQU4sRUFBUztvQkFBQSxNQUFBLEVBQVEsRUFBUjtpQkFBVCxDQUFiO2dCQUNWLE9BQU8sQ0FBQyxJQUFSLENBQWEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQWIsRUFGSjs7WUFHQSxJQUFDLENBQUEsV0FBRCxHQUFlLEtBVG5COztRQVVBLFNBQUEsR0FBWSxJQUFDLENBQUEsdUJBQUQsQ0FBeUIsQ0FBekI7UUFDWixJQUFvQixDQUFDLENBQUMsSUFBdEI7QUFBQSxtQkFBTyxVQUFQOztlQUNBLEVBQUUsQ0FBQyxNQUFILENBQVUsT0FBVixFQUFtQixJQUFDLENBQUEsUUFBRCxDQUFVLGlCQUFWLENBQW5CLEVBQWlELFNBQWpELEVBQTRELElBQUMsQ0FBQSxRQUFELENBQVUsb0JBQVYsQ0FBNUQ7SUF2QlM7O29CQTRCYix1QkFBQSxHQUF5QixTQUFDLENBQUQ7QUFFckIsWUFBQTtRQUFBLFNBQUEsR0FBWTtRQUNaLElBQUEsR0FBTztBQUNQO0FBQUEsYUFBQSxnREFBQTs7WUFDSSxHQUFBLEdBQU0sR0FBRyxDQUFDLE1BQUosQ0FBQTtZQUNOLElBQUEsQ0FBQSxDQUFhLEdBQUEsWUFBZSxPQUFmLElBQTBCLEdBQUEsWUFBZSxPQUF0RCxDQUFBO0FBQUEsc0JBQUE7O0FBRko7UUFHQSxDQUFBLEdBQUksS0FBQSxDQUFNLENBQU4sRUFBUztZQUFBLEtBQUEsRUFBTyxTQUFQO1NBQVQ7UUFDSixJQUFHLENBQUg7WUFDSSxJQUFBLEdBQU8sSUFBQyxDQUFBLFdBQVcsQ0FBQyxNQUFiLENBQW9CLENBQXBCLEVBQXVCLEdBQXZCO1lBQ1AsT0FBMkIsQ0FBQyxJQUFDLENBQUEsTUFBRixFQUFVLEtBQVYsQ0FBM0IsRUFBQyxnQkFBRCxFQUFnQixJQUFDLENBQUE7WUFDakIsT0FBdUIsQ0FBQyxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWIsQ0FBRCxFQUFrQixNQUFsQixDQUF2QixFQUFDLG1CQUFELEVBQVksSUFBQyxDQUFBO1lBQ2IsSUFBQyxDQUFBLFdBQUQsR0FBZSxLQUpuQjs7UUFLQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFiO1FBQ04sUUFBUztRQUNWLElBQUcsS0FBSyxDQUFDLFdBQU4sS0FBcUIsSUFBeEI7WUFDSSxPQUFBLEdBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFSLENBQUE7WUFDVixPQUFBLEdBQVUsS0FBSyxDQUFDO1lBQ2hCLElBQUcsT0FBQSxJQUFXLE9BQWQ7Z0JBQ0ksSUFBaUMsQ0FBakM7b0JBQUEsU0FBUyxDQUFDLElBQVYsQ0FBZSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBZixFQUFBOztnQkFDQSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQWEsSUFBQyxDQUFBLEdBQUYsR0FBTSxNQUFsQixDQUFmO2dCQUNBLElBQUcsT0FBSDtvQkFDSSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBSyxDQUFDLGlCQUFOLENBQUEsQ0FBeUIsQ0FBQyxJQUExQixDQUErQixJQUEvQixDQUFWLENBQWYsRUFESjs7Z0JBRUEsSUFBRyxPQUFIO29CQUNJLElBQStDLE9BQS9DO3dCQUFBLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFBLEdBQUssQ0FBQyxJQUFDLENBQUEsR0FBRCxHQUFPLEdBQVIsQ0FBZixDQUFmLEVBQUE7O29CQUNBLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFLLENBQUMsaUJBQU4sQ0FBQSxDQUF5QixDQUFDLElBQTFCLENBQStCLEtBQUEsR0FBSyxDQUFDLElBQUMsQ0FBQSxHQUFELEdBQU8sR0FBUixDQUFwQyxDQUFWLENBQWYsRUFGSjs7Z0JBR0EsU0FBUyxDQUFDLElBQVYsQ0FBZSxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQUEsR0FBSyxDQUFJLElBQUMsQ0FBQSxNQUFKLEdBQWdCLElBQWhCLEdBQTBCLEVBQTNCLENBQWYsQ0FBZixFQVJKO2FBQUEsTUFTSyxJQUFHLFNBQVMsQ0FBQyxNQUFWLElBQXFCLElBQUksQ0FBQyxNQUE3QjtnQkFDRCxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFmLEVBREM7YUFaVDs7ZUFjQSxTQUFTLENBQUMsTUFBVixDQUFpQixJQUFqQjtJQTdCcUI7O0lBaUN6QixLQUFDLENBQUEsSUFBRCxHQUFPLFNBQUMsS0FBRDtRQUVILElBQW1CLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQWhCLElBQXNCLEtBQU0sQ0FBQSxDQUFBLENBQU4sWUFBb0IsS0FBN0Q7QUFBQSxtQkFBTyxLQUFNLENBQUEsQ0FBQSxFQUFiOztlQUNBLElBQUksS0FBSixDQUFVLEtBQVY7SUFIRzs7OztHQWxLeUI7O0FBZ0xwQyxPQUFPLENBQUMsT0FBUixHQUF3Qjs7O0lBRVAsaUJBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxRQUFEO0lBQUQ7O3NCQUViLFNBQUEsR0FBVzs7c0JBRVgsT0FBQSxHQUFTLFNBQUMsSUFBRDtlQUNMLElBQUEsS0FBUSxJQUFDLENBQUE7SUFESjs7c0JBR1QsV0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUNULENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsS0FBWCxDQUFEO0lBRFM7O3NCQUdiLFFBQUEsR0FBVSxTQUFBO2VBQ04sR0FBQSxHQUFHLENBQUksSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUFILEdBQXVCLHVDQUFBLFNBQUEsQ0FBdkIsR0FBa0MsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFoRCxDQUFILEdBQXdELElBQXhELEdBQTRELElBQUMsQ0FBQTtJQUR2RDs7OztHQVowQjs7QUFleEMsT0FBTyxDQUFDLGFBQVIsR0FBOEI7Ozs7Ozs7OztHQUFzQjs7QUFFcEQsT0FBTyxDQUFDLGVBQVIsR0FBZ0M7Ozs7Ozs7OEJBQzVCLFdBQUEsR0FBYSxTQUFBO2VBQ1QsQ0FBQyxJQUFDLENBQUEsUUFBRCxDQUFVLE9BQVYsQ0FBRDtJQURTOzs7O0dBRHVDOztBQUl4RCxPQUFPLENBQUMsVUFBUixHQUEyQjs7O0lBQ1Ysb0JBQUE7UUFDVCw0Q0FBTSxLQUFOO0lBRFM7O3lCQUdiLFdBQUEsR0FBYSxTQUFDLENBQUQ7QUFDVCxZQUFBO1FBQUEsSUFBQSxHQUFPLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQUQ7UUFDUCxJQUFHLENBQUMsQ0FBQyxLQUFGLElBQVcsUUFBZDttQkFBNEIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLEVBQTVCO1NBQUEsTUFBQTttQkFBb0QsS0FBcEQ7O0lBRlM7Ozs7R0FKNkI7O0FBUTlDLE9BQU8sQ0FBQyxhQUFSLEdBQThCOzs7Ozs7Ozs7R0FBc0I7O0FBRXBELE9BQU8sQ0FBQyxZQUFSLEdBQTZCOzs7Ozs7Ozs7R0FBcUI7O0FBRWxELE9BQU8sQ0FBQyxrQkFBUixHQUFtQzs7Ozs7Ozs7O0dBQTJCOztBQUU5RCxPQUFPLENBQUMsaUJBQVIsR0FBa0M7Ozs7Ozs7Z0NBQzlCLFlBQUEsR0FBYzs7OztHQUQwQzs7QUFHNUQsT0FBTyxDQUFDLFlBQVIsR0FBNkI7Ozs7Ozs7MkJBQ3pCLFlBQUEsR0FBYzs7OztHQURnQzs7QUFHbEQsT0FBTyxDQUFDLGdCQUFSLEdBQWlDOzs7Ozs7OytCQUM3QixXQUFBLEdBQWE7OytCQUViLFVBQUEsR0FBWTs7K0JBRVosS0FBQSxHQUFPLFNBQUMsQ0FBRDtRQUNILElBQWUsSUFBQyxDQUFBLEtBQUQsS0FBVSxPQUFWLElBQXNCLENBQUksY0FBQyxDQUFDLENBQUUsY0FBSCxpQkFBVyxDQUFDLENBQUUsZUFBZixDQUF6QztBQUFBLG1CQUFPLEtBQVA7O1FBQ0EsSUFBZSxJQUFDLENBQUEsS0FBRCxLQUFVLFVBQVYsSUFBeUIsY0FBSSxDQUFDLENBQUUsY0FBL0M7QUFBQSxtQkFBTyxLQUFQOztJQUZHOzsrQkFJUCxXQUFBLEdBQWEsU0FBQyxDQUFEO2VBQ1QsQ0FBQyxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQUEsR0FBRyxJQUFDLENBQUEsR0FBSixHQUFVLElBQUMsQ0FBQSxLQUFYLEdBQWlCLEdBQTNCLENBQUQ7SUFEUzs7OztHQVR5Qzs7QUFZMUQsT0FBTyxDQUFDLFdBQVIsR0FBNEI7OztJQUNYLHFCQUFBO1FBQ1QsNkNBQU0sTUFBTjtJQURTOzswQkFHYixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLElBQUEsMENBQXdCLENBQUUsZUFBbkIsR0FBOEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBN0MsR0FBMEQsSUFBQyxDQUFBO2VBQ2xFLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQUQ7SUFGUzs7OztHQUorQjs7QUFRaEQsT0FBTyxDQUFDLGdCQUFSLEdBQWlDOzs7SUFDaEIsMEJBQUE7UUFDVCxrREFBTSxXQUFOO0lBRFM7OytCQUdiLFdBQUEsR0FBYSxTQUFDLENBQUQ7ZUFDVCxDQUFDLElBQUMsQ0FBQSxRQUFELENBQWEsQ0FBQyxDQUFDLEtBQUYsSUFBVyxZQUFkLEdBQWdDLFVBQWhDLEdBQWdELFFBQTFELENBQUQ7SUFEUzs7OztHQUp5Qzs7QUFPMUQsT0FBTyxDQUFDLFdBQVIsR0FBNEI7OztJQUNYLHFCQUFBO1FBQ1QsNkNBQU0sTUFBTjtJQURTOzs7O0dBRCtCOztBQUloRCxPQUFPLENBQUMsY0FBUixHQUErQjs7Ozs7Ozs7O0dBQXVCOztBQVV0RCxPQUFPLENBQUMsTUFBUixHQUF1Qjs7O0lBQ04sZ0JBQUMsVUFBRDtRQUFDLElBQUMsQ0FBQSxhQUFEO0lBQUQ7O3FCQUViLFFBQUEsR0FBVSxDQUFDLFlBQUQ7O3FCQUVWLFdBQUEsR0FBYTs7cUJBQ2IsVUFBQSxHQUFhOztxQkFDYixLQUFBLEdBQWE7O3FCQUViLGtCQUFBLEdBQW9CLFNBQUMsQ0FBRCxFQUFJLEtBQUo7QUFDaEIsWUFBQTtRQUFBLElBQUEsMENBQWtCLENBQUUsVUFBYixDQUFBO1FBQ1AsSUFBRyxJQUFBLElBQVMsQ0FBQSxDQUFBLElBQUEsWUFBb0IsTUFBcEIsQ0FBWjttQkFBNEMsSUFBSSxDQUFDLGtCQUFMLENBQXdCLENBQXhCLEVBQTJCLEtBQTNCLEVBQTVDO1NBQUEsTUFBQTttQkFBa0YsK0NBQU0sQ0FBTixFQUFTLEtBQVQsRUFBbEY7O0lBRmdCOztxQkFJcEIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7UUFBQSxNQUFBLEdBQVM7UUFFVCxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLEdBQUQsR0FBTyxDQUFBLFFBQUEsR0FBUSxDQUFJLElBQUMsQ0FBQSxVQUFKLEdBQW9CLEdBQXBCLEdBQTZCLEVBQTlCLENBQVIsQ0FBakIsQ0FBWjtRQUNBLElBQUcsSUFBQyxDQUFBLFVBQUo7WUFDSSxNQUFBLEdBQVMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFDLENBQUEsVUFBVSxDQUFDLGtCQUFaLENBQStCLENBQS9CLEVBQWtDLFdBQWxDLENBQWQsRUFEYjs7UUFFQSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFaO0FBQ0EsZUFBTztJQVBFOzs7O0dBYnFCOztBQXdCdEMsT0FBTyxDQUFDLFdBQVIsR0FBNEI7Ozs7Ozs7MEJBQ3hCLFdBQUEsR0FBYSxTQUFDLENBQUQ7UUFDVCxJQUFPLHNCQUFQO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx1Q0FBUCxFQURKOztlQUVBLDhDQUFBLFNBQUE7SUFIUzs7OztHQUQrQjs7QUFjaEQsT0FBTyxDQUFDLEtBQVIsR0FBc0I7OztJQUVMLGVBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxHQUFkO1FBQ1QsSUFBZSxDQUFJLEtBQUosSUFBYyxJQUFBLFlBQWdCLEtBQTdDO0FBQUEsbUJBQU8sS0FBUDs7UUFDQSxJQUFDLENBQUEsSUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYyxLQUFBLElBQVM7UUFDdkIsSUFBc0IsR0FBdEI7WUFBQSxJQUFFLENBQUEsR0FBQSxDQUFGLEdBQWMsS0FBZDs7QUFDQSxlQUFPO0lBTEU7O29CQU9iLFFBQUEsR0FBVSxDQUFDLE1BQUQsRUFBUyxZQUFUOztvQkFHVixHQUFBLEdBQUssU0FBQyxLQUFEO1FBQ0QsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosQ0FBbUIsS0FBbkI7ZUFDZDtJQUZDOztvQkFJTCxhQUFBLEdBQWUsU0FBQTtlQUNYLENBQUMsQ0FBQyxJQUFDLENBQUEsVUFBVSxDQUFDO0lBREg7O29CQUdmLFdBQUEsR0FBYSxTQUFDLElBQUQ7ZUFDVCxDQUFJLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBaEIsSUFBMkIsSUFBQyxDQUFBLElBQUQsWUFBaUI7SUFEbkM7O29CQUliLE9BQUEsR0FBYyxTQUFBO2VBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiO0lBQUg7O29CQUNkLE9BQUEsR0FBYyxTQUFBO2VBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxLQUFiO0lBQUg7O29CQUNkLFNBQUEsR0FBYyxTQUFBO2VBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLElBQW9CLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixDQUFBO0lBQXZCOztvQkFDZCxZQUFBLEdBQWMsU0FBQTtlQUFHLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBQSxJQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDLFlBQU4sQ0FBQTtJQUF2Qjs7b0JBQ2QsUUFBQSxHQUFjLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBRCxDQUFhLGFBQWI7SUFBSDs7b0JBQ2QsUUFBQSxHQUFjLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBRCxDQUFhLGFBQWI7SUFBSDs7b0JBQ2QsT0FBQSxHQUFjLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBRCxDQUFhLFlBQWI7SUFBSDs7b0JBQ2QsV0FBQSxHQUFjLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBRCxDQUFhLGdCQUFiO0lBQUg7O29CQUNkLE1BQUEsR0FBYyxTQUFBO2VBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxXQUFiO0lBQUg7O29CQUNkLFNBQUEsR0FBYyxTQUFBO2VBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBYSxjQUFiO0lBQUg7O29CQUNkLFFBQUEsR0FBYyxTQUFBO0FBQ1YsWUFBQTtBQUFBO0FBQUEsYUFBQSx3Q0FBQTs7WUFDSSxJQUFhLElBQUksQ0FBQyxJQUFMLElBQWEsSUFBQSxZQUFnQixJQUExQztBQUFBLHVCQUFPLE1BQVA7O0FBREo7ZUFFQTtJQUhVOztvQkFLZCxhQUFBLEdBQWUsU0FBQTtlQUFHLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBQSxJQUFlLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBZixJQUE4QixJQUFDLENBQUEsT0FBRCxDQUFBLENBQTlCLElBQ2UsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQURmLElBQzZCLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FEN0IsSUFDMkMsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUQzQyxJQUMwRCxJQUFDLENBQUEsUUFBRCxDQUFBLENBRDFELElBRWUsSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUZmLElBRWlDLElBQUMsQ0FBQSxNQUFELENBQUEsQ0FGakMsSUFFOEMsSUFBQyxDQUFBLFNBQUQsQ0FBQTtJQUZqRDs7b0JBSWYsV0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUFVLENBQUksSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFoQixJQUEyQixJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsQ0FBbEI7SUFBckM7O29CQUNiLE9BQUEsR0FBYSxTQUFDLElBQUQ7ZUFBVSxDQUFJLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBaEIsSUFBMkIsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQWMsSUFBZDtJQUFyQzs7b0JBQ2IsS0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUFVLENBQUksSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFoQixJQUEyQixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sQ0FBWSxDQUFaO0lBQXJDOztvQkFFYixRQUFBLEdBQVUsU0FBQyxhQUFEO1FBQ04sSUFBYSxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQXpCO0FBQUEsbUJBQU8sTUFBUDs7ZUFDQSxDQUFDLElBQUMsQ0FBQSxJQUFELFlBQWlCLEdBQWxCLENBQUEsSUFBMkIsQ0FBQyxDQUFJLGFBQUosSUFBcUIsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUE1QjtJQUZyQjs7b0JBSVYsUUFBQSxHQUFVLFNBQUE7QUFDTixZQUFBO1FBQUEsT0FBa0IsSUFBQyxDQUFBLFVBQW5CLEVBQU07ZUFDTixRQUFBLFlBQW9CO0lBRmQ7O29CQUlWLFdBQUEsR0FBYSxTQUFDLFNBQUQ7QUFDVCxZQUFBO2VBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEtBQWUsU0FBZixJQUE2QixJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosS0FBc0IsQ0FBbkQsb0RBQ3VCLENBQUUsZUFBckIsS0FBOEI7SUFGekI7O29CQUtiLE1BQUEsR0FBUSxTQUFBO1FBQ0osSUFBRyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQWY7bUJBQTJCLEtBQTNCO1NBQUEsTUFBQTttQkFBcUMsSUFBQyxDQUFBLEtBQXRDOztJQURJOztvQkFPUixjQUFBLEdBQWdCLFNBQUMsQ0FBRDtBQUVaLFlBQUE7UUFBQSxPQUFjLElBQUMsQ0FBQSxVQUFmLEVBQU07UUFDTixJQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixHQUFxQixDQUFyQixJQUEyQixDQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixDQUFBLENBQS9CLElBQXFELGlCQUFJLElBQUksQ0FBRSxTQUFOLENBQUEsV0FBNUQ7QUFDSSxtQkFBTyxDQUFDLElBQUQsRUFBTyxJQUFQLEVBRFg7O1FBRUEsSUFBQSxHQUFPLElBQUksS0FBSixDQUFVLElBQUMsQ0FBQSxJQUFYLEVBQWlCLElBQUMsQ0FBQSxVQUFXLGFBQTdCO1FBQ1AsSUFBRyxJQUFJLENBQUMsU0FBTCxDQUFBLENBQUg7WUFDSSxJQUFBLEdBQU8sSUFBSSxpQkFBSixDQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsTUFBckIsQ0FBdEI7WUFDUCxJQUFBLEdBQU8sSUFBSSxLQUFKLENBQVUsSUFBSSxNQUFKLENBQVcsSUFBSSxNQUFKLENBQVcsSUFBWCxFQUFpQixJQUFqQixDQUFYLENBQVYsRUFGWDs7UUFHQSxJQUFBLENBQTJCLElBQTNCO0FBQUEsbUJBQU8sQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFQOztRQUNBLElBQUcsSUFBSSxDQUFDLFNBQUwsQ0FBQSxDQUFIO1lBQ0ksSUFBQSxHQUFPLElBQUksaUJBQUosQ0FBc0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFSLENBQXFCLE1BQXJCLENBQXRCO1lBQ1AsSUFBQSxHQUFPLElBQUksS0FBSixDQUFVLElBQUksTUFBSixDQUFXLElBQVgsRUFBaUIsSUFBSSxDQUFDLEtBQXRCLENBQVY7WUFDUCxJQUFBLEdBQU8sSUFBSSxLQUFKLENBQVUsSUFBVixFQUhYOztlQUlBLENBQUMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFULENBQUQsRUFBaUIsSUFBSSxLQUFKLENBQVUsSUFBQSxJQUFRLElBQUksQ0FBQyxJQUF2QixFQUE2QixDQUFDLElBQUEsSUFBUSxJQUFULENBQTdCLENBQWpCO0lBZFk7O29CQXFCaEIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUVULFlBQUE7UUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sR0FBYyxJQUFDLENBQUE7UUFDZixLQUFBLEdBQVEsSUFBQyxDQUFBO1FBQ1QsU0FBQSxHQUFZLElBQUMsQ0FBQSxJQUFJLENBQUMsa0JBQU4sQ0FBeUIsQ0FBekIsRUFBNEIsQ0FBSSxLQUFLLENBQUMsTUFBVCxHQUFxQixZQUFyQixHQUF1QyxJQUF4QyxDQUE1QjtRQUNaLElBQUcsS0FBSyxDQUFDLE1BQU4sSUFBaUIsU0FBUyxDQUFDLElBQVYsQ0FBZSxlQUFBLENBQWdCLFNBQWhCLENBQWYsQ0FBcEI7WUFDSSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFmLEVBREo7O0FBRUEsYUFBQSx5Q0FBQTs7WUFDSSxTQUFTLENBQUMsSUFBVixrQkFBZ0IsSUFBSSxDQUFDLGtCQUFMLENBQXdCLENBQXhCLENBQWhCO0FBREo7ZUFFQTtJQVRTOztvQkFhYixVQUFBLEdBQVksU0FBQyxDQUFEOzJDQUVSLElBQUMsQ0FBQSxlQUFELElBQUMsQ0FBQSxlQUFtQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO0FBQ2hCLG9CQUFBO2dCQUFBLElBQUcsR0FBQSxHQUFNLEtBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixDQUFpQixDQUFqQixDQUFUO29CQUNJLFFBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFULENBQW1CLENBQUMsSUFBcEIsYUFBeUIsS0FBQyxDQUFBLFVBQTFCO0FBQ0EsMkJBQU8sSUFGWDs7QUFHQTtBQUFBLHFCQUFBLGdEQUFBOzt5QkFBZ0MsSUFBSSxDQUFDOzs7b0JBQ2pDLElBQUksQ0FBQyxJQUFMLEdBQVk7b0JBQ1osR0FBQSxHQUFNLElBQUksS0FBSixDQUFVLEtBQUMsQ0FBQSxJQUFYLEVBQWlCLEtBQUMsQ0FBQSxVQUFXLFlBQTdCO29CQUNOLEdBQUEsR0FBTSxJQUFJLEtBQUosQ0FBVSxLQUFDLENBQUEsSUFBWCxFQUFpQixLQUFDLENBQUEsVUFBVyxTQUE3QjtvQkFDTixJQUFHLEdBQUcsQ0FBQyxTQUFKLENBQUEsQ0FBSDt3QkFDSSxHQUFBLEdBQU0sSUFBSSxpQkFBSixDQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsS0FBckIsQ0FBdEI7d0JBQ04sR0FBQSxHQUFNLElBQUksTUFBSixDQUFXLElBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsR0FBaEIsQ0FBWDt3QkFDTixHQUFHLENBQUMsSUFBSixHQUFXLElBSGY7O0FBSUEsMkJBQU8sSUFBSSxFQUFKLENBQU8sSUFBSSxTQUFKLENBQWMsR0FBZCxDQUFQLEVBQTJCLEdBQTNCLEVBQWdDO3dCQUFBLElBQUEsRUFBTSxJQUFOO3FCQUFoQztBQVJYO3VCQVNBO1lBYmdCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFILENBQUE7SUFGVDs7OztHQXBHb0I7O0FBMkhwQyxPQUFPLENBQUMsT0FBUixHQUF3Qjs7O0lBRVAsaUJBQUMsUUFBRDtRQUFDLElBQUMsQ0FBQSxVQUFEO0lBQUQ7O3NCQUViLFdBQUEsR0FBYTs7c0JBQ2IsVUFBQSxHQUFhOztzQkFFYixXQUFBLEdBQWEsU0FBQyxDQUFELEVBQUksS0FBSjtBQUVULFlBQUE7UUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQWlCLGlCQUFqQixFQUFvQyxNQUFwQztRQUNWLElBQUEsR0FBTyxJQUFBLEdBQUksQ0FBQyxTQUFBLENBQVUsT0FBVixFQUFtQixJQUFDLENBQUEsR0FBcEIsQ0FBRCxDQUFKLEdBQThCLENBQUksYUFBUSxPQUFSLEVBQUEsSUFBQSxNQUFILEdBQXdCLElBQUEsR0FBSyxJQUFDLENBQUEsR0FBOUIsR0FBeUMsRUFBMUMsQ0FBOUIsR0FBMkU7UUFDbEYsSUFBMEIsQ0FBQyxLQUFBLElBQVMsQ0FBQyxDQUFDLEtBQVosQ0FBQSxLQUFzQixTQUFoRDtZQUFBLElBQUEsR0FBTyxDQUFDLENBQUMsTUFBRixHQUFXLEtBQWxCOztlQUNBLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQUQsRUFBa0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQWxCO0lBTFM7Ozs7R0FQdUI7O0FBc0J4QyxPQUFPLENBQUMsSUFBUixHQUFxQjs7O0lBQ0osY0FBQyxTQUFELEVBQVksS0FBWixFQUF3QixLQUF4QjtRQUFDLElBQUMsQ0FBQSxXQUFEO1FBQVcsSUFBQyxDQUFBLHVCQUFELFFBQVE7UUFBSSxJQUFDLENBQUEsT0FBRDtRQUNqQyxJQUFDLENBQUEsS0FBRCxHQUFjO1FBQ2QsSUFBRyxJQUFDLENBQUEsUUFBRCxZQUFxQixLQUFyQixJQUErQixJQUFDLENBQUEsUUFBUSxDQUFDLGFBQVYsQ0FBQSxDQUFsQztZQUNJLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixDQUFnQiwyQkFBaEIsRUFESjs7SUFGUzs7bUJBS2IsUUFBQSxHQUFVLENBQUMsVUFBRCxFQUFhLE1BQWI7O21CQU1WLDJCQUFBLEdBQTZCLFNBQUMsWUFBRDtBQUV6QixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsWUFBRCxJQUFrQixJQUFDLENBQUEseUJBQXRCO1lBQ0ksSUFBQyxDQUFBLFlBQVksQ0FBQyxVQUFkLEdBQTJCLFlBQVksQ0FBQztZQUN4QyxJQUFDLENBQUEsWUFBWSxDQUFDLFlBQWQsR0FBNkIsWUFBWSxDQUFDO1lBQzFDLElBQUEseUNBQWdCLENBQUUsY0FBWCxJQUFtQixJQUFDLENBQUE7WUFDM0IsSUFBRyxJQUFJLENBQUMseUJBQVI7Z0JBQ0ksSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBdkIsR0FBb0MsWUFBWSxDQUFDO2dCQUNqRCxJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUF2QixHQUFzQyxZQUFZLENBQUM7Z0JBQ25ELElBQUksQ0FBQywyQkFBTCxDQUFpQyxZQUFqQyxFQUhKOztZQUlBLE9BQU8sSUFBQyxDQUFBLDBCQVJaOztlQVNBLHVEQUFBLFNBQUE7SUFYeUI7O21CQWM3QixXQUFBLEdBQWEsU0FBQTtBQUNULFlBQUE7UUFBQSxJQUFBLHlDQUFnQixDQUFFLGNBQVgsSUFBbUIsSUFBQyxDQUFBO1FBQzNCLElBQUcsSUFBQSxZQUFnQixJQUFoQixJQUF5QixDQUFJLElBQUksQ0FBQyxLQUFyQztZQUNJLElBQUksQ0FBQyxXQUFMLENBQUEsRUFESjtTQUFBLE1BQUE7WUFHSSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBSGI7O1FBSUEsSUFBQyxDQUFBLHlCQUFELEdBQTZCO2VBQzdCO0lBUFM7O21CQVViLFVBQUEsR0FBWSxTQUFDLENBQUQ7QUFDUixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsSUFBSjtZQUNJLElBQUcsSUFBQSxZQUFnQixTQUFuQjtnQkFDSSxJQUFBLEdBQU8sSUFBSSxPQUFKLENBQVksSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsQ0FBaEIsQ0FBWjtnQkFDUCxJQUFBLEdBQU8sSUFBSSxLQUFKLENBQVUsSUFBVixFQUZYO2FBQUEsTUFBQTtnQkFJSSxJQUFjLEdBQUEsR0FBTSxVQUFBLENBQVcsQ0FBWCxFQUFjLElBQWQsRUFBb0IsVUFBcEIsQ0FBcEI7QUFBQSwyQkFBTyxJQUFQOztnQkFDQSxPQUFlLElBQUksS0FBSixDQUFVLElBQUMsQ0FBQSxRQUFYLENBQW9CLENBQUMsY0FBckIsQ0FBb0MsQ0FBcEMsQ0FBZixFQUFDLGNBQUQsRUFBTyxlQUxYOztZQU1BLElBQUEsR0FBTyxJQUFJLElBQUosQ0FBUyxJQUFULEVBQWUsSUFBQyxDQUFBLElBQWhCO1lBQ1AsSUFBSSxDQUFDLEtBQUwsR0FBYSxJQUFDLENBQUE7WUFDZCxJQUFBLEdBQU8sSUFBSSxPQUFKLENBQVksU0FBQSxHQUFTLENBQUUsSUFBSSxDQUFDLE9BQUwsQ0FBYSxDQUFiLENBQUYsQ0FBVCxHQUEyQixtQkFBdkM7QUFDUCxtQkFBTyxJQUFJLEVBQUosQ0FBTyxJQUFQLEVBQWEsSUFBSSxLQUFKLENBQVUsSUFBVixDQUFiLEVBQThCO2dCQUFBLElBQUEsRUFBTSxJQUFOO2FBQTlCLEVBVlg7O1FBV0EsSUFBQSxHQUFPO1FBQ1AsSUFBQSxHQUFPO0FBQ1AsZUFBQSxJQUFBO1lBQ0ksSUFBRyxJQUFJLENBQUMsUUFBTCxZQUF5QixJQUE1QjtnQkFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQVY7Z0JBQ0EsSUFBQSxHQUFPLElBQUksQ0FBQztBQUNaLHlCQUhKOztZQUlBLElBQUEsQ0FBQSxDQUFhLElBQUksQ0FBQyxRQUFMLFlBQXlCLEtBQXRDLENBQUE7QUFBQSxzQkFBQTs7WUFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQVY7WUFDQSxJQUFBLENBQUEsQ0FBYSxDQUFDLElBQUEsR0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQXRCLENBQUEsWUFBdUMsSUFBcEQsQ0FBQTtBQUFBLHNCQUFBOztRQVBKO0FBUUE7QUFBQSxhQUFBLHdDQUFBOztZQUNJLElBQUcsR0FBSDtnQkFDSSxJQUFHLElBQUksQ0FBQyxRQUFMLFlBQXlCLElBQTVCO29CQUNJLElBQUksQ0FBQyxRQUFMLEdBQWdCLElBRHBCO2lCQUFBLE1BQUE7b0JBR0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFkLEdBQXFCLElBSHpCO2lCQURKOztZQUtBLEdBQUEsR0FBTSxVQUFBLENBQVcsQ0FBWCxFQUFjLElBQWQsRUFBb0IsVUFBcEI7QUFOVjtlQU9BO0lBN0JROzttQkErQlosV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUVULFlBQUE7O2dCQUFTLENBQUUsS0FBWCxHQUFtQixJQUFDLENBQUE7O1FBQ3BCLGFBQUEsR0FBZ0IsS0FBSyxDQUFDLG9CQUFOLENBQTJCLENBQTNCLEVBQThCLElBQUMsQ0FBQSxJQUEvQixFQUFxQyxJQUFyQztRQUNoQixJQUFHLGFBQWEsQ0FBQyxNQUFqQjtBQUNJLG1CQUFPLElBQUMsQ0FBQSxZQUFELENBQWMsQ0FBZCxFQUFpQixhQUFqQixFQURYOztRQUVBLFlBQUEsR0FBZTtBQUNmO0FBQUEsYUFBQSw4REFBQTs7WUFDSSxJQUFHLFFBQUg7Z0JBQWlCLFlBQVksQ0FBQyxJQUFiLENBQWtCLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFsQixFQUFqQjs7WUFDQSxZQUFZLENBQUMsSUFBYixxQkFBbUIsR0FBRyxDQUFDLGtCQUFKLENBQXVCLENBQXZCLEVBQTBCLFVBQTFCLENBQW5CO0FBRko7UUFJQSxTQUFBLEdBQVk7UUFDWixJQUFHLElBQUEsWUFBZ0IsU0FBbkI7WUFDSSxPQUFBLEdBQVUsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsQ0FBaEIsQ0FBQSxHQUFxQixDQUFBLFFBQUEsR0FBUSxDQUFDLElBQUMsQ0FBQSxTQUFELENBQVcsQ0FBWCxDQUFELENBQVI7WUFDL0IsSUFBRyxZQUFZLENBQUMsTUFBaEI7Z0JBQTRCLE9BQUEsSUFBVyxLQUF2Qzs7WUFDQSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsT0FBVixDQUFmLEVBSEo7U0FBQSxNQUFBO1lBS0ksSUFBRyxJQUFDLENBQUEsS0FBSjtnQkFBZSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBVixDQUFmLEVBQWY7O1lBQ0EsU0FBUyxDQUFDLElBQVYsa0JBQWUsSUFBQyxDQUFBLFFBQVEsQ0FBQyxrQkFBVixDQUE2QixDQUE3QixFQUFnQyxZQUFoQyxDQUFmO1lBQ0EsU0FBUyxDQUFDLElBQVYsQ0FBZSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBZixFQVBKOztRQVFBLFNBQVMsQ0FBQyxJQUFWLGtCQUFlLFlBQWY7UUFDQSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFmO2VBQ0E7SUF0QlM7O21CQStCYixZQUFBLEdBQWMsU0FBQyxDQUFELEVBQUksU0FBSjtBQUVWLFlBQUE7UUFBQSxJQUFHLElBQUEsWUFBZ0IsU0FBbkI7QUFDSSxtQkFBTyxFQUFFLENBQUMsTUFBSCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVksQ0FBRSxJQUFDLENBQUEsY0FBRCxDQUFnQixDQUFoQixDQUFGLENBQUEsR0FBcUIsU0FBckIsR0FBNkIsQ0FBQyxJQUFDLENBQUEsU0FBRCxDQUFXLENBQVgsQ0FBRCxDQUE3QixHQUE0QyxJQUF4RCxDQUFWLEVBQ0gsU0FERyxFQUNRLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQURSLEVBRFg7O1FBSUEsSUFBRyxJQUFDLENBQUEsS0FBSjtZQUNJLEdBQUEsR0FBTSxJQUFDLENBQUEsR0FBRCxHQUFPO0FBQ2IsbUJBQU8sRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLGlDQUFBLEdBRXJCLEdBRnFCLEdBRWpCLG9DQUZpQixHQUdyQixHQUhxQixHQUdqQiwyREFIaUIsR0FJckIsR0FKcUIsR0FJakIsc0RBSmlCLEdBS3JCLElBQUMsQ0FBQSxHQUxvQixHQUtoQixLQUxNLENBQVYsRUFNRixJQUFDLENBQUEsUUFBUSxDQUFDLGtCQUFWLENBQTZCLENBQTdCLEVBQWdDLFVBQWhDLENBTkUsRUFPSCxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FQRyxFQU9jLFNBUGQsRUFPeUIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQkFBVixDQVB6QixFQUZYOztRQVdBLE1BQUEsR0FBUztRQUNULElBQUEsR0FBTyxJQUFJLEtBQUosQ0FBVSxJQUFDLENBQUEsUUFBWDtRQUNQLElBQUcsQ0FBQyxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFoQixDQUFBLENBQVIsQ0FBQSxJQUFtQyxJQUFJLENBQUMsU0FBTCxDQUFBLENBQXRDO1lBQ0ksR0FBQSxHQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBUixDQUFxQixLQUFyQjtZQUNOLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBQSxHQUFJLEdBQUosR0FBUSxLQUFsQixDQUFkLEVBQ0osSUFBSSxDQUFDLGtCQUFMLENBQXdCLENBQXhCLEVBQTJCLFVBQTNCLENBREksRUFFTCxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FGSyxFQUdMLElBQUksQ0FBQyxrQkFBTCxDQUF3QixDQUF4QixDQUhLLEVBRmI7U0FBQSxNQUFBO1lBT0ksR0FBQSxHQUFNLElBQUksQ0FBQyxrQkFBTCxDQUF3QixDQUF4QixFQUEyQixZQUEzQjtZQUNOLElBQTJCLFNBQVMsQ0FBQyxJQUFWLENBQWUsZUFBQSxDQUFnQixHQUFoQixDQUFmLENBQTNCO2dCQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsWUFBRCxDQUFjLEdBQWQsRUFBTjs7WUFDQSxJQUFHLElBQUg7Z0JBQ0ksR0FBQSxHQUFNLGVBQUEsQ0FBZ0IsR0FBaEI7Z0JBQ04sR0FBRyxDQUFDLElBQUosWUFBVSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsQ0FBeEIsQ0FBVixFQUZKO2FBQUEsTUFBQTtnQkFJSSxHQUFBLEdBQU0sT0FKVjs7WUFLQSxNQUFBLEdBQVMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxHQUFkLEVBZGI7O2VBZUEsTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFQLENBQWMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxTQUFBLEdBQVUsR0FBVixHQUFjLElBQXhCLENBQWQsRUFBNEMsU0FBNUMsRUFBdUQsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBQXZEO0lBbENDOzs7O0dBbEdnQjs7QUE4SWxDLE9BQU8sQ0FBQyxTQUFSLEdBQTBCOzs7SUFFVCxtQkFBQyxJQUFEO1FBQ1QsMkNBQU0sSUFBTixpQkFBWSxPQUFPLENBQUMsSUFBSSxLQUFKLENBQVUsSUFBSSxpQkFBSixDQUFzQixXQUF0QixDQUFWLENBQUQsQ0FBbkI7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVO0lBSEQ7O3dCQU9iLGNBQUEsR0FBZ0IsU0FBQyxDQUFEO0FBRVosWUFBQTtRQUFBLE1BQUEsR0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVIsQ0FBQTtRQUNULHFCQUFHLE1BQU0sQ0FBRSxjQUFYO1lBQ0ssb0JBQUQsRUFBUSxrQkFBUixFQUFjO1lBQ2QsSUFBRyxLQUFLLENBQUMsU0FBTixDQUFBLENBQUg7Z0JBQ0ksSUFBQSxHQUFPLElBQUksaUJBQUosQ0FBc0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBZixDQUE0QixNQUE1QixDQUF0QjtnQkFDUCxJQUFBLEdBQU8sSUFBSSxLQUFKLENBQVUsSUFBSSxNQUFKLENBQVcsSUFBSSxNQUFKLENBQVcsSUFBWCxFQUFpQixLQUFqQixDQUFYLENBQVY7Z0JBQ1AsUUFBUSxDQUFDLElBQVQsR0FBZ0I7Z0JBQ2hCLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBcEIsQ0FBMkIsQ0FBM0IsRUFBOEIsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUEvQyxFQUpKOztZQUtBLElBQUcsSUFBSSxDQUFDLFNBQUwsQ0FBQSxDQUFBLElBQW9CLENBQUMsSUFBQSxZQUFnQixLQUFoQixJQUEwQixJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVgsQ0FBQSxDQUEzQixDQUF2QjtnQkFDSSxJQUFBLEdBQU8sSUFBSSxpQkFBSixDQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFmLENBQTRCLE1BQTVCLENBQXRCO2dCQUNQLElBQUEsR0FBTyxJQUFJLEtBQUosQ0FBVSxJQUFJLE1BQUosQ0FBVyxJQUFYLEVBQWlCLElBQUksQ0FBQyxLQUF0QixDQUFWO2dCQUNQLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBcEIsQ0FBQTtnQkFDQSxRQUFRLENBQUMsVUFBVSxDQUFDLElBQXBCLENBQXlCLElBQXpCLEVBSko7O1lBS0EsUUFBQSxHQUFXLENBQUMsSUFBSSxNQUFKLENBQVcsSUFBSSxZQUFKLENBQWlCLFdBQWpCLENBQVgsQ0FBRDtZQUNYLElBQTJELE1BQU0sRUFBQyxNQUFELEVBQWpFO2dCQUFBLFFBQVEsQ0FBQyxJQUFULENBQWMsSUFBSSxNQUFKLENBQVcsSUFBSSxZQUFKLENBQWlCLGFBQWpCLENBQVgsQ0FBZCxFQUFBOztZQUNBLFFBQVEsQ0FBQyxJQUFULENBQWlCLFlBQUgsR0FBYyxJQUFJLEtBQUosQ0FBVSxJQUFWLENBQWQsR0FBa0MsSUFBaEQ7bUJBQ0EsQ0FBQyxJQUFJLEtBQUosZ0JBQVUsT0FBTyxLQUFqQixFQUF3QixRQUF4QixDQUFELENBQWtDLENBQUMsT0FBbkMsQ0FBMkMsQ0FBM0MsRUFmSjtTQUFBLE1BZ0JLLHFCQUFHLE1BQU0sQ0FBRSxhQUFYO21CQUVFLE1BQU0sQ0FBQyxJQUFSLEdBQWEseUJBRmQ7U0FBQSxNQUFBO21CQUlELElBQUMsQ0FBQSxLQUFELENBQU8sa0RBQVAsRUFKQzs7SUFuQk87O3dCQTJCaEIsU0FBQSxHQUFXLFNBQUMsQ0FBRDtBQUNQLFlBQUE7UUFBQSxNQUFBLEdBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQztlQUNqQixDQUFDLE1BQUEsSUFBVyxDQUFJLE1BQU0sQ0FBQyxLQUF0QixJQUFnQyxNQUFNLENBQUMsT0FBeEMsQ0FBQSxJQUFvRDtJQUY3Qzs7d0JBSVgsWUFBQSxHQUFjLFNBQUMsQ0FBRCxFQUFJLFNBQUo7UUFFVixJQUFHLFNBQVMsQ0FBQyxNQUFWLEtBQW9CLENBQXBCLElBQTBCLFNBQVUsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFiLEtBQXFCLFdBQS9DLElBQStELDhCQUEvRCxJQUFxRixDQUFDLENBQUMsT0FBUSxDQUFBLG1CQUFBLENBQWxHO0FBRUksbUJBQU8sRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQUEsR0FBRSxDQUFDLElBQUMsQ0FBQSw4QkFBRCxDQUFBLENBQUQsQ0FBRixHQUFzQyxDQUFFLElBQUMsQ0FBQSxjQUFELENBQWdCLENBQWhCLENBQUYsQ0FBdEMsR0FBMkQsU0FBM0QsR0FBbUUsQ0FBQyxJQUFDLENBQUEsU0FBRCxDQUFXLENBQVgsQ0FBRCxDQUFuRSxHQUFrRixJQUE1RixDQUFWLEVBQTRHLFNBQTVHLEVBQXVILElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUF2SCxFQUZYOztlQUlBLDZDQUFBLFNBQUE7SUFOVTs7d0JBUWQsOEJBQUEsR0FBZ0MsU0FBQTtBQUU1QixZQUFBO1FBQUEsSUFBYSxDQUFJLENBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxlQUFULENBQWpCO0FBQUEsbUJBQU8sR0FBUDs7UUFFQSxDQUFBLEdBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFkLENBQWtCLFNBQUMsR0FBRDtBQUNsQixnQkFBQTtZQUFBLENBQUEsR0FBSSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUN0QixDQUFBLEdBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUMsSUFBRCxFQUFsQixJQUE0QixPQUE1QixJQUF1QzttQkFDeEMsQ0FBRCxHQUFHLEdBQUgsR0FBSyxDQUFDLENBQUEsR0FBRSxDQUFIO1FBSFcsQ0FBbEI7ZUFLSiw2QkFBQSxHQUE2QixDQUFDLENBQUMsQ0FBQyxJQUFGLENBQU8sR0FBUCxDQUFELENBQTdCLEdBQXlDO0lBVGI7Ozs7R0FoRFE7O0FBb0U1QyxPQUFPLENBQUMsdUJBQVIsR0FBd0M7OztJQUN2QixpQ0FBQyxJQUFEOztZQUFDLE9BQU87O1FBQ2pCLHlEQUFPLElBQUksS0FBSixDQUFVLElBQUksaUJBQUosQ0FBc0IsUUFBdEIsQ0FBVixDQUFQLEVBQWtELElBQWxELEVBQXdELEtBQXhEO0lBRFM7Ozs7R0FEdUQ7O0FBTXhFLE9BQU8sQ0FBQyxrQkFBUixHQUFtQzs7O0lBQ2xCLDRCQUFDLFFBQUQsRUFBVyxHQUFYLEVBQWdCLElBQWhCO1FBQ1QsSUFBb0UsR0FBQSxZQUFlLGFBQW5GO1lBQUEsR0FBQSxHQUFNLElBQUksd0JBQUosQ0FBNkIsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFFLElBQUksS0FBSixDQUFVLEdBQVYsQ0FBRixDQUFYLENBQTdCLEVBQU47O1FBQ0Esb0RBQU0sUUFBTixFQUFnQixDQUFFLEdBQUYsQ0FBaEIsRUFBeUIsSUFBekI7SUFGUzs7aUNBSWIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtRQUVULENBQUMsQ0FBQyxvQkFBRixHQUF5QjtlQUN6QixJQUFDLENBQUEsUUFBUSxDQUFDLGtCQUFWLENBQTZCLENBQTdCLEVBQWdDLFlBQWhDLENBQTZDLENBQUMsTUFBOUMsQ0FBcUQsSUFBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxrQkFBVCxDQUE0QixDQUE1QixFQUErQixVQUEvQixDQUFyRDtJQUhTOzs7O0dBTDZDOztBQW9COUQsT0FBTyxDQUFDLE9BQVIsR0FBd0I7OztJQUVQLGlCQUFDLE1BQUQsRUFBUyxPQUFUO1FBQUMsSUFBQyxDQUFBLFFBQUQ7UUFBUSxJQUFDLENBQUEsU0FBRDtJQUFUOztzQkFFYixRQUFBLEdBQVUsQ0FBQyxPQUFELEVBQVUsUUFBVjs7c0JBR1Ysa0JBQUEsR0FBb0IsU0FBQyxDQUFEO2VBQ2hCLElBQUksSUFBSixDQUFTLElBQUksS0FBSixDQUFVLElBQUksT0FBSixDQUFZLE9BQUEsQ0FBUSxRQUFSLEVBQWtCLENBQWxCLENBQVosQ0FBVixDQUFULEVBQXFELENBQUMsSUFBQyxDQUFBLEtBQUYsRUFBUyxJQUFDLENBQUEsTUFBVixDQUFyRCxDQUF1RSxDQUFDLGtCQUF4RSxDQUEyRixDQUEzRjtJQURnQjs7OztHQVBnQjs7QUFtQnhDLE9BQU8sQ0FBQyxNQUFSLEdBQXVCOzs7SUFDTixnQkFBQyxLQUFELEVBQVEsR0FBUjtRQUFDLElBQUMsQ0FBQSxPQUFEO1FBQ1YsSUFBQyxDQUFBLElBQUQsR0FBUSxHQUFBLEtBQU87SUFETjs7cUJBR2IsUUFBQSxHQUFVLENBQUMsTUFBRDs7cUJBRVYsa0JBQUEsR0FBb0IsU0FBQyxDQUFEO0FBQ2hCLFlBQUE7UUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBTixDQUF5QixDQUF6QjtRQUNQLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBQTtRQUNQLElBQUcsSUFBQSxZQUFnQixZQUFuQjtZQUNJLFdBQUcsSUFBSSxDQUFDLEtBQUwsRUFBQSxhQUFjLFlBQWQsRUFBQSxJQUFBLE1BQUg7dUJBQ0ssQ0FBQSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBaUIsU0FBQSxXQUFBLElBQUEsQ0FBQSxFQUFTLENBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQUEsQ0FBQSxFQUQvQjthQUFBLE1BQUE7dUJBR0ssQ0FBQSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBZ0IsU0FBQSxXQUFBLElBQUEsQ0FBQSxFQUhyQjthQURKO1NBQUEsTUFBQTttQkFNSyxDQUFBLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFnQixTQUFBLFdBQUEsSUFBQSxDQUFBLEVBQVMsQ0FBQSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBQSxDQUFBLEVBTjlCOztJQUhnQjs7cUJBV3BCLFNBQUEsR0FBVzs7OztHQWpCdUI7O0FBMkJ0QyxPQUFPLENBQUMsS0FBUixHQUFzQjs7O0lBQ0wsZUFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFFBQUQ7SUFBRDs7b0JBRWIsUUFBQSxHQUFVLENBQUMsT0FBRDs7b0JBRVYsa0JBQUEsR0FBb0IsU0FBQyxDQUFEO2VBQ2hCLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBQVYsRUFBMEIsSUFBQyxDQUFBLEtBQUssQ0FBQyxrQkFBUCxDQUEwQixDQUExQixFQUE2QixXQUE3QixDQUExQixFQUFxRSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBckU7SUFEZ0I7O29CQUdwQixTQUFBLEdBQVcsU0FBQTtlQUNQLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUCxDQUFBO0lBRE87Ozs7R0FScUI7O0FBcUJwQyxPQUFPLENBQUMsS0FBUixHQUFzQjs7O29CQUVsQixRQUFBLEdBQVUsQ0FBQyxNQUFELEVBQVMsSUFBVDs7SUFFRyxlQUFDLEtBQUQsRUFBUSxHQUFSLEVBQWEsR0FBYjtRQUFDLElBQUMsQ0FBQSxPQUFEO1FBQU8sSUFBQyxDQUFBLEtBQUQ7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBYSxHQUFBLEtBQU87UUFDcEIsSUFBQyxDQUFBLE1BQUQsR0FBYSxJQUFDLENBQUEsU0FBSixHQUFtQixFQUFuQixHQUEyQjtJQUY1Qjs7b0JBT2IsZ0JBQUEsR0FBa0IsU0FBQyxDQUFEO0FBQ2QsWUFBQTtRQUFBLENBQUEsR0FBSSxLQUFBLENBQU0sQ0FBTixFQUFTO1lBQUEsR0FBQSxFQUFLLElBQUw7U0FBVDtRQUNKLFNBQUEsR0FBWSxHQUFBLENBQUksQ0FBSixFQUFPLFdBQVA7UUFDWixPQUFxQixJQUFDLENBQUEsb0JBQUQsQ0FBc0IsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQVksQ0FBWixFQUFlLFVBQWYsRUFBMkIsU0FBM0IsQ0FBdEIsQ0FBckIsRUFBQyxJQUFDLENBQUEsZUFBRixFQUFTLElBQUMsQ0FBQTtRQUNWLE9BQXFCLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixJQUFDLENBQUEsRUFBRSxDQUFDLEtBQUosQ0FBVSxDQUFWLEVBQWEsVUFBYixFQUF5QixTQUF6QixDQUF0QixDQUFyQixFQUFDLElBQUMsQ0FBQSxhQUFGLEVBQU8sSUFBQyxDQUFBO1FBQ1IsSUFBa0YsSUFBQSxHQUFPLEdBQUEsQ0FBSSxDQUFKLEVBQU8sTUFBUCxDQUF6RjtZQUFBLE9BQXFCLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsRUFBYyxVQUFkLEVBQTBCLFNBQTFCLENBQXRCLENBQXJCLEVBQUMsSUFBQyxDQUFBLGNBQUYsRUFBUSxJQUFDLENBQUEsa0JBQVQ7O1FBQ0EsSUFBQyxDQUFBLE9BQUQsR0FBYyxJQUFDLENBQUEsSUFBSSxDQUFDLFFBQU4sQ0FBQSxDQUFILEdBQXlCLE1BQUEsQ0FBTyxJQUFDLENBQUEsT0FBUixDQUF6QixHQUE4QztRQUN6RCxJQUFDLENBQUEsS0FBRCxHQUFjLElBQUMsQ0FBQSxFQUFFLENBQUMsUUFBSixDQUFBLENBQUgsR0FBeUIsTUFBQSxDQUFPLElBQUMsQ0FBQSxLQUFSLENBQXpCLEdBQThDO2VBQ3pELElBQUMsQ0FBQSxPQUFELG1CQUFjLElBQUksQ0FBRSxRQUFOLENBQUEsV0FBSCxHQUF5QixNQUFBLENBQU8sSUFBQyxDQUFBLE9BQVIsQ0FBekIsR0FBOEM7SUFSM0M7O29CQWFsQixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLElBQUEsQ0FBMkIsSUFBQyxDQUFBLE9BQTVCO1lBQUEsSUFBQyxDQUFBLGdCQUFELENBQWtCLENBQWxCLEVBQUE7O1FBQ0EsSUFBQSxDQUErQixDQUFDLENBQUMsS0FBakM7QUFBQSxtQkFBTyxJQUFDLENBQUEsWUFBRCxDQUFjLENBQWQsRUFBUDs7UUFHQSxLQUFBLEdBQVcsc0JBQUEsSUFBYztRQUN6QixHQUFBLEdBQVcsR0FBQSxDQUFJLENBQUosRUFBTyxPQUFQO1FBQ1gsT0FBQSxHQUFXLEdBQUEsQ0FBSSxDQUFKLEVBQU8sTUFBUDtRQUNYLFVBQUEsR0FBYSxPQUFBLElBQVksT0FBQSxLQUFXO1FBQ3BDLE9BQUEsR0FBYyxHQUFELEdBQUssS0FBTCxHQUFVLElBQUMsQ0FBQTtRQUN4QixJQUEwQixJQUFDLENBQUEsR0FBRCxLQUFRLElBQUMsQ0FBQSxLQUFuQztZQUFBLE9BQUEsSUFBVyxJQUFBLEdBQUssSUFBQyxDQUFBLElBQWpCOztRQUNBLElBQTJCLElBQUMsQ0FBQSxJQUFELEtBQVMsSUFBQyxDQUFBLE9BQXJDO1lBQUEsT0FBQSxJQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsS0FBakI7O1FBQ0EsT0FBVyxDQUFJLEdBQUQsR0FBSyxJQUFMLEdBQVMsSUFBQyxDQUFBLE1BQWIsRUFBMEIsR0FBRCxHQUFLLElBQUwsR0FBUyxJQUFDLENBQUEsTUFBbkMsQ0FBWCxFQUFDLFlBQUQsRUFBSztRQUdMLFFBQUEsR0FBYyxvQkFBSCxHQUNKLElBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBZCxHQUF3QixFQUFELEdBQUksR0FBSixHQUFPLElBQUMsQ0FBQSxLQUEvQixHQUErQyxFQUFELEdBQUksR0FBSixHQUFPLElBQUMsQ0FBQSxLQUQvQyxHQUVILEtBQUgsR0FDRCxDQUFBLENBQUEsT0FBYSxDQUFDLElBQUMsQ0FBQSxPQUFGLEVBQVcsSUFBQyxDQUFBLEtBQVosQ0FBYixFQUFDLGNBQUQsRUFBTyxZQUFQLEVBQUEsSUFBQSxDQUFBLEVBQ0csSUFBQSxJQUFRLEVBQVgsR0FBc0IsRUFBRCxHQUFJLEdBQUosR0FBTyxFQUE1QixHQUF5QyxFQUFELEdBQUksR0FBSixHQUFPLEVBRC9DLENBREMsR0FJRCxDQUFBLElBQUEsR0FBVSxJQUFDLENBQUEsT0FBSixHQUFvQixJQUFDLENBQUEsT0FBRixHQUFVLE1BQTdCLEdBQTJDLElBQUMsQ0FBQSxPQUFGLEdBQVUsTUFBVixHQUFnQixJQUFDLENBQUEsS0FBbEUsRUFDRyxJQUFELEdBQU0sS0FBTixHQUFXLEVBQVgsR0FBYyxHQUFkLEdBQWlCLElBQUMsQ0FBQSxLQUFsQixHQUF3QixLQUF4QixHQUE2QixFQUE3QixHQUFnQyxHQUFoQyxHQUFtQyxJQUFDLENBQUEsS0FEdEM7UUFJSixRQUFBLEdBQWMsSUFBQyxDQUFBLE9BQUosR0FDSixHQUFELEdBQUssTUFBTCxHQUFXLElBQUMsQ0FBQSxPQURQLEdBRUgsS0FBSCxHQUNFLFVBQUgsR0FDTyxJQUFBLElBQVEsRUFBWCxHQUFtQixJQUFBLEdBQUssR0FBeEIsR0FBbUMsSUFBQSxHQUFLLEdBRDVDLEdBR08sSUFBQSxJQUFRLEVBQVgsR0FBc0IsR0FBRCxHQUFLLElBQTFCLEdBQXNDLEdBQUQsR0FBSyxJQUo3QyxHQU1FLFVBQUgsR0FDTyxJQUFELEdBQU0sT0FBTixHQUFhLEdBQWIsR0FBaUIsT0FBakIsR0FBd0IsR0FEOUIsR0FHTyxJQUFELEdBQU0sS0FBTixHQUFXLEdBQVgsR0FBZSxPQUFmLEdBQXNCLEdBQXRCLEdBQTBCO1FBRXBDLElBQXdDLFVBQXhDO1lBQUEsT0FBQSxHQUFjLE9BQUQsR0FBUyxLQUFULEdBQWMsUUFBM0I7O1FBQ0EsSUFBeUMsVUFBekM7WUFBQSxRQUFBLEdBQWMsT0FBRCxHQUFTLEtBQVQsR0FBYyxTQUEzQjs7ZUFHQSxDQUFDLElBQUMsQ0FBQSxRQUFELENBQWEsT0FBRCxHQUFTLElBQVQsR0FBYSxRQUFiLEdBQXNCLElBQXRCLEdBQTBCLFFBQXRDLENBQUQ7SUExQ1M7O29CQThDYixZQUFBLEdBQWMsU0FBQyxDQUFEO0FBQ1YsWUFBQTtRQUFBLEtBQUEsR0FBUSxzQkFBQSxJQUFjO1FBQ3RCLElBQUcsS0FBQSxJQUFVLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFDLENBQUEsS0FBckIsQ0FBQSxJQUErQixFQUE1QztZQUNJLEtBQUEsR0FBUTs7Ozs7WUFDUixJQUFlLElBQUMsQ0FBQSxTQUFoQjtnQkFBQSxLQUFLLENBQUMsR0FBTixDQUFBLEVBQUE7O0FBQ0EsbUJBQU8sQ0FBQyxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUEsR0FBRyxDQUFFLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFGLENBQUgsR0FBdUIsR0FBakMsQ0FBRCxFQUhYOztRQUlBLEdBQUEsR0FBUyxJQUFDLENBQUEsR0FBRCxHQUFPO1FBQ2hCLENBQUEsR0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsR0FBckIsRUFBMEI7WUFBQSxNQUFBLEVBQVEsSUFBUjtTQUExQjtRQUNULE1BQUEsR0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsU0FBckI7UUFDVCxHQUFBLEdBQVMsSUFBQSxHQUFLLEdBQUwsR0FBVyxNQUFYLEdBQWtCO1FBQzNCLElBQUcsS0FBSDtZQUNJLENBQUMsQ0FBQyxLQUFGLEdBQVU7WUFDVixJQUFBLEdBQU8sZUFBQSxDQUFnQixJQUFDLENBQUEsV0FBRCxDQUFhLENBQWIsQ0FBaEIsRUFGWDtTQUFBLE1BQUE7WUFJSSxJQUFBLEdBQU8sQ0FBRyxDQUFELEdBQUcsS0FBSCxHQUFRLElBQUMsQ0FBQSxLQUFYLENBQUEsR0FBcUIsQ0FBRyxJQUFDLENBQUEsR0FBRCxLQUFRLElBQUMsQ0FBQSxLQUFaLEdBQXVCLElBQUEsR0FBSyxJQUFDLENBQUEsR0FBN0IsR0FBd0MsRUFBeEM7WUFDNUIsSUFBQSxHQUFVLElBQUMsQ0FBQSxPQUFGLEdBQVUsTUFBVixHQUFnQixJQUFDLENBQUE7WUFDMUIsSUFBQSxHQUFPLE1BQUEsR0FBTyxJQUFQLEdBQVksSUFBWixHQUFnQixJQUFoQixHQUFxQixLQUFyQixHQUEwQixDQUExQixHQUE0QixJQUE1QixHQUFnQyxJQUFDLENBQUEsTUFBakMsR0FBd0MsR0FBeEMsR0FBMkMsSUFBQyxDQUFBLEtBQTVDLEdBQWtELEtBQWxELEdBQXVELENBQXZELEdBQXlELElBQXpELEdBQTZELElBQUMsQ0FBQSxNQUE5RCxHQUFxRSxHQUFyRSxHQUF3RSxJQUFDLENBQUEsS0FBekUsR0FBK0UsSUFBL0UsR0FBbUYsSUFBbkYsR0FBd0YsS0FBeEYsR0FBNkYsQ0FBN0YsR0FBK0YsT0FBL0YsR0FBc0csQ0FBdEcsR0FBd0csS0FObkg7O1FBT0EsSUFBQSxHQUFXLElBQUEsR0FBSyxNQUFMLEdBQVksUUFBWixHQUFvQixDQUFwQixHQUFzQixRQUF0QixHQUE4QixHQUE5QixHQUFrQyxTQUFsQyxHQUEyQyxNQUEzQyxHQUFrRCxLQUFsRCxHQUF1RCxDQUFDLENBQUM7UUFDcEUsT0FBQSxHQUFVLFNBQUMsSUFBRDtrQ0FBVSxJQUFJLENBQUUsUUFBTixDQUFlLGtCQUFmO1FBQVY7UUFDVixJQUEyQixPQUFBLENBQVEsSUFBQyxDQUFBLElBQVQsQ0FBQSxJQUFrQixPQUFBLENBQVEsSUFBQyxDQUFBLEVBQVQsQ0FBN0M7WUFBQSxJQUFBLEdBQVUsY0FBVjs7ZUFDQSxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsZUFBQSxHQUFnQixHQUFoQixHQUFvQixJQUFwQixHQUF3QixHQUF4QixHQUE0QixPQUE1QixHQUFtQyxJQUFuQyxHQUF3QyxHQUF4QyxHQUEyQyxJQUEzQyxHQUFnRCxlQUFoRCxHQUE4RCxnQkFBQyxPQUFPLEVBQVIsQ0FBOUQsR0FBeUUsR0FBbkYsQ0FBRDtJQXBCVTs7OztHQXRFa0I7O0FBc0dwQyxPQUFPLENBQUMsS0FBUixHQUFzQjs7O29CQUVsQixRQUFBLEdBQVUsQ0FBQyxPQUFEOztJQUVHLGVBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxRQUFEO1FBQ1YscUNBQUE7SUFEUzs7b0JBTWIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7UUFBQSxPQUFhLElBQUMsQ0FBQSxLQUFkLEVBQUMsWUFBRCxFQUFLO1FBQ0wsWUFBQSxHQUFlLElBQUEsSUFBUyxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsQ0FBeEIsRUFBMkIsV0FBM0IsQ0FBVCxJQUFvRCxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFEO1FBRW5FLElBQUcsRUFBSDtZQUNJLFFBQUEsR0FBbUIsRUFBRSxDQUFDLGtCQUFILENBQXNCLENBQXRCLEVBQXlCLFdBQXpCO1lBQ25CLFlBQUEsR0FBZSxlQUFBLENBQWdCLFFBQWhCO1lBQ2YsSUFBRyxDQUFJLENBQUMsQ0FBSSxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVgsSUFBeUIsQ0FBQyxZQUFELEtBQWlCLENBQUMsQ0FBNUMsQ0FBUDtnQkFDSSxLQUFBLEdBQVEsSUFBQSxHQUFPLENBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFWLEdBQ1gsWUFEVyxHQUVQLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FBSCxHQUNELEVBQUEsR0FBRSxDQUFDLENBQUMsWUFBRCxHQUFnQixDQUFqQixDQURELEdBR0QsQ0FBQSxRQUFBLEdBQVcsRUFBRSxDQUFDLGtCQUFILENBQXNCLENBQXRCLEVBQXlCLFlBQXpCLENBQVgsRUFDQSxHQUFBLEdBQUcsQ0FBQyxlQUFBLENBQWdCLFFBQWhCLENBQUQsQ0FBSCxHQUE2QixhQUQ3QixDQUxXLEVBRG5CO2FBSEo7O2VBV0EsQ0FBQyxJQUFDLENBQUEsUUFBRCxDQUFVLFNBQUEsR0FBUyxDQUFFLGVBQUEsQ0FBZ0IsWUFBaEIsQ0FBRixDQUFULEdBQTBDLENBQUUsS0FBQSxJQUFTLEVBQVgsQ0FBMUMsR0FBeUQsR0FBbkUsQ0FBRDtJQWZTOzs7O0dBVm1COztBQWlDcEMsT0FBTyxDQUFDLEdBQVIsR0FBb0I7OztJQUVILGFBQUMsS0FBRCxFQUFRLFNBQVI7UUFBUSxJQUFDLENBQUEsZ0NBQUQsWUFBYTtRQUM5QixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxVQUFELEdBQWMsS0FBQSxJQUFTO0lBRHpCOztrQkFHYixRQUFBLEdBQVUsQ0FBQyxZQUFEOztrQkFFVixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLEtBQUEsR0FBUSxJQUFDLENBQUE7UUFDVCxJQUFHLElBQUMsQ0FBQSxTQUFKO0FBQ0ksaUJBQUEseUNBQUE7O29CQUF1QixJQUFBLFlBQWdCO29CQUNuQyxJQUFJLENBQUMsS0FBTCxDQUFXLHFEQUFYOztBQURKLGFBREo7O0FBR0EsYUFBQSx1RUFBQTs7Z0JBQTJDLENBQUMsSUFBSSxDQUFDLFFBQUwsSUFBaUIsSUFBbEIsQ0FBdUIsQ0FBQyxJQUF4QixZQUF3QztBQUFuRjs7QUFBQTtRQUNBLFVBQUEsR0FBYyxZQUFBLEdBQWUsS0FBSyxDQUFDO1FBQ25DLEdBQUEsR0FBYyxDQUFDLENBQUMsTUFBRixJQUFZO1FBQzFCLFVBQUEsR0FBYyxJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFDLENBQUEsVUFBakI7UUFDZCxNQUFBLEdBQVM7UUFDVCxJQUFHLFVBQUg7WUFDSSxJQUFBLEdBQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFSLENBQXFCLEtBQXJCO1lBQ1AsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQUEsR0FBTSxHQUFOLEdBQVksSUFBWixHQUFpQixLQUEzQixDQUFaLEVBRko7O1FBR0EsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUEsR0FBRyxDQUFJLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQWhCLElBQXFCLFlBQUEsS0FBZ0IsQ0FBeEMsR0FBK0MsR0FBL0MsR0FBd0QsSUFBekQsQ0FBYixDQUFaO0FBQ0EsYUFBQSxpREFBQTs7WUFDSSxJQUFHLENBQUEsS0FBSyxZQUFSO2dCQUNJLElBQXlDLENBQUEsS0FBSyxDQUE5QztvQkFBQSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQSxHQUFLLEdBQUwsR0FBUyxHQUFuQixDQUFaLEVBQUE7O2dCQUNBLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQVosRUFGSjs7WUFHQSxJQUFBLEdBQVUsQ0FBQSxLQUFLLEtBQUssQ0FBQyxNQUFOLEdBQWUsQ0FBcEIsSUFBeUIsQ0FBQSxLQUFLLFlBQUEsR0FBZSxDQUFoRCxHQUNILEVBREcsR0FFQyxJQUFBLEtBQVEsVUFBUixJQUFzQixJQUFBLFlBQWdCLE9BQXpDLEdBQ0QsSUFEQyxHQUdEO1lBQ0osTUFBQSxHQUFZLElBQUEsWUFBZ0IsT0FBbkIsR0FBZ0MsRUFBaEMsR0FBd0M7WUFDakQsSUFBaUIsVUFBQSxJQUFlLENBQUEsR0FBSSxZQUFwQztnQkFBQSxNQUFBLElBQVUsSUFBVjs7WUFDQSxJQUFHLElBQUEsWUFBZ0IsTUFBbkI7Z0JBQ0ksSUFBRyxJQUFJLENBQUMsT0FBTCxLQUFnQixRQUFuQjtvQkFDSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQW5CLENBQXlCLGFBQUEsR0FBYyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQTFELEVBREo7O2dCQUVBLElBQUcsSUFBSSxDQUFDLFFBQUwsWUFBeUIsS0FBekIsSUFBbUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFkLENBQUEsQ0FBdEM7b0JBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFkLENBQW9CLG9CQUFwQixFQURKO2lCQUhKOztZQUtBLElBQUcsSUFBQSxZQUFnQixLQUFoQixJQUEwQixJQUFJLEVBQUMsSUFBRCxFQUFqQztnQkFDSSxJQUFBLEdBQU8sSUFBSSxNQUFKLENBQVcsSUFBSSxDQUFDLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUE5QixFQUFvQyxJQUFwQyxFQUEwQyxRQUExQyxFQURYOztZQUVBLElBQUcsQ0FBQSxDQUFBLElBQUEsWUFBb0IsT0FBcEIsQ0FBSDtnQkFDSSxJQUFHLENBQUEsR0FBSSxZQUFQO29CQUNJLElBQUcsQ0FBQSxDQUFBLElBQUEsWUFBb0IsTUFBcEIsQ0FBSDt3QkFDSSxJQUFBLEdBQU8sSUFBSSxNQUFKLENBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixRQUF2QixFQURYO3FCQURKO2lCQUFBLE1BQUE7b0JBSUksSUFBRyxJQUFBLFlBQWdCLE1BQW5CO3dCQUNJLEdBQUEsR0FBTSxJQUFJLENBQUM7d0JBQ1gsS0FBQSxHQUFRLElBQUksQ0FBQyxNQUZqQjtxQkFBQSxNQUFBO3dCQUlJLE9BQWUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFWLENBQWdCLENBQWhCLENBQWYsRUFBQyxhQUFELEVBQU07d0JBQ04sSUFBb0MsR0FBQSxZQUFlLGlCQUFuRDs0QkFBQSxHQUFBLEdBQU0sSUFBSSxZQUFKLENBQWlCLEdBQUcsQ0FBQyxLQUFyQixFQUFOO3lCQUxKOztvQkFNQSxJQUFBLEdBQU8sSUFBSSxNQUFKLENBQVksSUFBSSxLQUFKLENBQVcsSUFBSSxpQkFBSixDQUFzQixJQUF0QixDQUFYLEVBQXdDLENBQUMsSUFBSSxNQUFKLENBQVcsR0FBWCxDQUFELENBQXhDLENBQVosRUFBdUUsS0FBdkUsRUFWWDtpQkFESjs7WUFZQSxJQUFHLE1BQUg7Z0JBQWUsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsQ0FBWixFQUFmOztZQUNBLE1BQU0sQ0FBQyxJQUFQLGVBQVksSUFBSSxDQUFDLGtCQUFMLENBQXdCLENBQXhCLEVBQTJCLFNBQTNCLENBQVo7WUFDQSxJQUFHLElBQUg7Z0JBQWEsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBWixFQUFiOztBQWpDSjtRQWtDQSxJQUFHLFVBQUg7WUFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBQSxHQUFNLEdBQU4sR0FBWSxJQUFaLEdBQWlCLElBQWpCLEdBQXFCLElBQUMsQ0FBQSxHQUF0QixHQUEwQixHQUFwQyxDQUFaLEVBREo7U0FBQSxNQUFBO1lBR0ksSUFBMEMsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBMUQ7Z0JBQUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUEsR0FBSyxJQUFDLENBQUEsR0FBTixHQUFVLEdBQXBCLENBQVosRUFBQTthQUhKOztRQUlBLElBQUcsSUFBQyxDQUFBLEtBQUQsSUFBVyxDQUFJLFVBQWxCO21CQUFrQyxJQUFDLENBQUEsWUFBRCxDQUFjLE1BQWQsRUFBbEM7U0FBQSxNQUFBO21CQUE0RCxPQUE1RDs7SUFwRFM7O2tCQXNEYixPQUFBLEdBQVMsU0FBQyxJQUFEO0FBQ0wsWUFBQTtBQUFBO0FBQUEsYUFBQSx3Q0FBQTs7Z0JBQTZCLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBYjtBQUF1Qix1QkFBTzs7QUFBM0Q7ZUFDQTtJQUZLOzs7O0dBN0RtQjs7QUF1RWhDLE9BQU8sQ0FBQyxHQUFSLEdBQW9COzs7SUFFSCxhQUFDLElBQUQ7UUFDVCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsSUFBUTtJQURWOztrQkFHYixRQUFBLEdBQVUsQ0FBQyxTQUFEOztrQkFFVixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLElBQUEsQ0FBK0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUF4QztBQUFBLG1CQUFPLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQUQsRUFBUDs7UUFDQSxDQUFDLENBQUMsTUFBRixJQUFZO1FBQ1osTUFBQSxHQUFTLEtBQUssQ0FBQyxvQkFBTixDQUEyQixDQUEzQixFQUE4QixJQUFDLENBQUEsT0FBL0I7UUFDVCxJQUFpQixNQUFNLENBQUMsTUFBeEI7QUFBQSxtQkFBTyxPQUFQOztRQUVBLE1BQUEsR0FBUztRQUNULFlBQUE7O0FBQWdCO0FBQUE7aUJBQUEsd0NBQUE7OzZCQUFBLEdBQUcsQ0FBQyxrQkFBSixDQUF1QixDQUF2QixFQUEwQixVQUExQjtBQUFBOzs7QUFDaEIsYUFBQSxnRUFBQTs7WUFDSSxJQUFHLEtBQUg7Z0JBQ0ksTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBWixFQURKOztZQUVBLE1BQU0sQ0FBQyxJQUFQLGVBQVksU0FBWjtBQUhKO1FBSUEsSUFBRyxlQUFBLENBQWdCLE1BQWhCLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsSUFBaEMsQ0FBQSxJQUF5QyxDQUE1QztZQUNJLE1BQU0sQ0FBQyxPQUFQLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFBLEdBQU0sQ0FBQyxDQUFDLE1BQWxCLENBQWY7WUFDQSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQSxHQUFLLElBQUMsQ0FBQSxHQUFOLEdBQVUsR0FBcEIsQ0FBWixFQUZKO1NBQUEsTUFBQTtZQUlJLE1BQU0sQ0FBQyxPQUFQLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBQWY7WUFDQSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFaLEVBTEo7O2VBTUE7SUFsQlM7O2tCQW9CYixPQUFBLEdBQVMsU0FBQyxJQUFEO0FBQ0wsWUFBQTtBQUFBO0FBQUEsYUFBQSx3Q0FBQTs7Z0JBQXlCLEdBQUcsQ0FBQyxPQUFKLENBQVksSUFBWjtBQUFzQix1QkFBTzs7QUFBdEQ7ZUFDQTtJQUZLOzs7O0dBM0JtQjs7QUF1Q2hDLE9BQU8sQ0FBQyxLQUFSLEdBQXNCOzs7SUFFTCxlQUFDLFNBQUQsRUFBWSxPQUFaLEVBQXFCLEtBQXJCO1FBQUMsSUFBQyxDQUFBLFdBQUQ7UUFBVyxJQUFDLENBQUEsU0FBRDtRQUFTLElBQUMsQ0FBQSx1QkFBRCxRQUFRLElBQUk7UUFDMUMsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjtJQUZUOztvQkFJYixRQUFBLEdBQVUsQ0FBQyxVQUFELEVBQWEsUUFBYixFQUF1QixNQUF2Qjs7b0JBRVYsd0JBQUEsR0FBMEI7O29CQUkxQixhQUFBLEdBQWUsU0FBQTtBQUVYLFlBQUE7UUFBQSxJQUFBLENBQXdDLElBQUMsQ0FBQSxRQUF6QztBQUFBLG1CQUFPLElBQUMsQ0FBQSx5QkFBUjs7UUFDQSxPQUFjLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBeEIsRUFBTTtRQUNOLElBQUEsR0FBVSxJQUFILEdBQ0gsSUFBQSxZQUFnQixNQUFoQixJQUEyQixJQUFJLENBQUMsSUFEN0IsR0FHSCxJQUFDLENBQUEsUUFBUSxDQUFDO1FBQ2QsSUFBQSxDQUFBLENBQU8sSUFBQSxZQUFnQixpQkFBaEIsSUFBcUMsSUFBQSxZQUFnQixZQUE1RCxDQUFBO0FBQ0ksbUJBQU8sSUFBQyxDQUFBLHlCQURaOztRQUVBLElBQUEsR0FBTyxJQUFJLENBQUM7UUFDWixJQUFBLENBQU8sSUFBUDtZQUNJLE9BQUEsR0FBVSxjQUFBLENBQWUsSUFBZjtZQUNWLElBQTJCLE9BQTNCO2dCQUFBLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixDQUFnQixPQUFoQixFQUFBO2FBRko7O1FBR0EsSUFBRyxhQUFRLFlBQVIsRUFBQSxJQUFBLE1BQUg7bUJBQTZCLEdBQUEsR0FBSSxLQUFqQztTQUFBLE1BQUE7bUJBQTZDLEtBQTdDOztJQWRXOztvQkFrQmYsVUFBQSxHQUFZLFNBQUMsSUFBRDtlQUVSLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsS0FBdkIsRUFBOEIsU0FBQyxJQUFEO1lBQzFCLElBQWdCLElBQUksQ0FBQyxTQUFyQjtBQUFBLHVCQUFPLE1BQVA7O1lBQ0EsSUFBRyxJQUFBLFlBQWdCLFdBQW5CO3VCQUNJLElBQUksQ0FBQyxLQUFMLEdBQWtCLEtBRHRCO2FBQUEsTUFFSyxJQUFHLElBQUEsWUFBZ0IsSUFBbkI7Z0JBQ0QsSUFBMEIsSUFBSSxDQUFDLEtBQS9COzJCQUFBLElBQUksQ0FBQyxPQUFMLEdBQWtCLEtBQWxCO2lCQURDOztRQUpxQixDQUE5QjtJQUZROztvQkFXWixpQkFBQSxHQUFtQixTQUFDLENBQUQ7QUFFZixZQUFBO0FBQUE7QUFBQSxhQUFBLHdDQUFBOztZQUNJLEdBQUEsR0FBTSxDQUFDLElBQUksS0FBSixDQUFXLElBQUksV0FBZixFQUE2QixDQUFDLElBQUksTUFBSixDQUFXLElBQVgsQ0FBRCxDQUE3QixDQUFELENBQWdELENBQUMsT0FBakQsQ0FBeUQsQ0FBekQ7WUFDTixJQUFDLENBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFYLENBQW1CLElBQUksT0FBSixDQUFlLEdBQUQsR0FBSyxLQUFMLEdBQVMsQ0FBQyxPQUFBLENBQVEsTUFBUixFQUFnQixDQUFoQixDQUFELENBQVQsR0FBNEIsR0FBNUIsR0FBK0IsR0FBL0IsR0FBbUMsU0FBakQsQ0FBbkI7QUFGSjtJQUZlOztvQkFTbkIsYUFBQSxHQUFlLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxDQUFiO0FBRVgsWUFBQTtRQUFBLEtBQUEsR0FBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVc7UUFDN0IsS0FBQTs7QUFBUTttQkFBTSxNQUFBLEdBQVMsS0FBSyxDQUFDLEtBQU4sQ0FBQSxDQUFmO2dCQUNKLElBQUcsTUFBQSxZQUFrQixNQUFyQjtvQkFDSSxJQUFBLEdBQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQztvQkFDdkIsT0FBTyxNQUFNLENBQUM7b0JBQ2QsSUFBQSxHQUFPLE1BQU0sQ0FBQztvQkFDZCxJQUFHLElBQUksQ0FBQyxLQUFMLEtBQWMsYUFBakI7d0JBQ0ksSUFBRyxJQUFDLENBQUEsSUFBSjs0QkFDSSxNQUFNLENBQUMsS0FBUCxDQUFhLG9EQUFiLEVBREo7O3dCQUVBLElBQUcsSUFBSSxDQUFDLEtBQVI7NEJBQ0ksTUFBTSxDQUFDLEtBQVAsQ0FBYSxpREFBYixFQURKOzt3QkFFQSxJQUFHLElBQUEsWUFBZ0IsSUFBbkI7NEJBQ0ksTUFBQSxHQUFTLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FEckI7eUJBQUEsTUFBQTs0QkFHSSxJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLENBQUMsVUFBVSxDQUFDLFlBQWIsQ0FBMEIsTUFBMUI7NEJBQ2hCLE1BQUEsR0FBUyxJQUFJLE1BQUosQ0FBVyxJQUFJLGlCQUFKLENBQXNCLElBQUMsQ0FBQSxZQUF2QixDQUFYLEVBQWlELElBQWpELEVBSmI7eUJBTEo7cUJBQUEsTUFBQTt3QkFXSSxJQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUMsSUFBRCxFQUFsQjs0QkFDSSxJQUFJLEVBQUMsTUFBRCxFQUFKLEdBQWMsS0FEbEI7eUJBQUEsTUFBQTs0QkFHSSxHQUFBLEdBQVMsSUFBSSxDQUFDLFNBQUwsQ0FBQSxDQUFILEdBQXlCLElBQUksS0FBSixDQUFVLElBQVYsQ0FBekIsR0FBNkMsSUFBSSxNQUFKLENBQVcsSUFBWDs0QkFDbkQsTUFBTSxDQUFDLFFBQVAsR0FBa0IsSUFBSSxLQUFKLENBQVUsSUFBSSxpQkFBSixDQUFzQixJQUF0QixDQUFWLEVBQXVDLENBQUUsSUFBSSxNQUFKLENBQVcsSUFBSSxZQUFKLENBQWlCLFdBQWpCLENBQVgsQ0FBRixFQUE0QyxHQUE1QyxDQUF2Qzs0QkFDbEIsSUFBRyxJQUFBLFlBQWdCLElBQWhCLElBQXlCLElBQUksQ0FBQyxLQUFqQztnQ0FDSSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsSUFBakI7Z0NBQ0EsSUFBSSxDQUFDLEtBQUwsR0FBYSxNQUZqQjs2QkFMSjt5QkFYSjtxQkFKSjs7NkJBdUJBO1lBeEJJLENBQUE7OztlQTBCUixPQUFBLENBQVEsS0FBUjtJQTdCVzs7b0JBaUNmLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxDQUFQO2VBRU4sSUFBQyxDQUFBLGdCQUFELENBQWtCLEtBQWxCLEVBQXlCLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsS0FBRDtBQUNyQixvQkFBQTtnQkFBQSxJQUFBLEdBQU87Z0JBQ1AsSUFBZ0IsS0FBQSxZQUFpQixLQUFqQztBQUFBLDJCQUFPLE1BQVA7O2dCQUNBLElBQUcsS0FBQSxZQUFpQixLQUFwQjtBQUNJO0FBQUEseUJBQUEsZ0RBQUE7O3dCQUNJLElBQUcsSUFBQSxZQUFnQixNQUFoQixJQUEyQixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQWQsQ0FBMEIsSUFBMUIsQ0FBOUI7NEJBQ0ksSUFBSSxDQUFDLEtBQUssRUFBQyxNQUFELEVBQVYsR0FBb0IsS0FEeEI7eUJBQUEsTUFFSyxJQUFHLElBQUEsWUFBZ0IsS0FBaEIsSUFBMEIsSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFkLENBQTdCOzRCQUNELElBQUEsR0FBTzs0QkFDUCxJQUFLLENBQUEsQ0FBQSxDQUFMLEdBQVUsS0FBQyxDQUFBLGFBQUQsQ0FBZSxJQUFmLEVBQXFCLElBQXJCLEVBQTJCLENBQTNCLEVBRlQ7O0FBSFQ7b0JBTUEsS0FBSyxDQUFDLFdBQU4sR0FBb0IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxJQUFSO29CQUUzQixJQUFHLEtBQUssQ0FBQyxTQUFOLElBQW9CLENBQUMsQ0FBQyxPQUFRLENBQUEsbUJBQUEsQ0FBakM7d0JBQ0ksS0FBQyxDQUFBLCtCQUFELENBQWlDLElBQWpDLEVBQXVDLENBQXZDLEVBQTBDLEtBQTFDLEVBREo7cUJBVEo7O3VCQVlBLElBQUEsSUFBUyxDQUFBLENBQUEsS0FBQSxZQUFxQixLQUFyQjtZQWZZO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QjtJQUZNOztvQkFtQlYsK0JBQUEsR0FBaUMsU0FBQyxJQUFELEVBQU8sQ0FBUCxFQUFVLFNBQVY7QUFFN0IsWUFBQTtBQUFBO0FBQUEsYUFBQSx3Q0FBQTs7WUFDSSxJQUFHLElBQUEsWUFBZ0IsSUFBbkI7Z0JBQ0ksSUFBWSx3Q0FBa0IsQ0FBRSxjQUFoQztBQUFBLDZCQUFBOztnQkFDQSxNQUFBLEdBQVMsSUFBSSxDQUFDLE1BQU8sQ0FBQSxDQUFBLENBQUUsQ0FBQztnQkFDeEIsSUFBRyxDQUFJLE1BQU0sQ0FBQyxTQUFkO0FBQTZCLDJCQUE3Qjs7Z0JBQ0EsSUFBRyxDQUFJLE1BQUosWUFBc0IsR0FBekI7QUFBa0MsMkJBQU8sR0FBQSxDQUFJLGdDQUFKLEVBQXpDOztnQkFDQSxJQUFHLENBQUksSUFBSSxDQUFDLElBQVQsWUFBeUIsS0FBNUI7QUFBdUMsMkJBQU8sR0FBQSxDQUFJLGdDQUFKLEVBQTlDOztBQUNBO0FBQUEscUJBQUEsd0NBQUE7O29CQUNJLElBQUcsUUFBQSxZQUFvQixTQUF2Qjt3QkFDSSxRQUFRLENBQUMsZUFBVCxHQUEyQixPQUQvQjs7QUFESixpQkFOSjs7QUFESjtJQUY2Qjs7b0JBaUJqQyxzQkFBQSxHQUF3QixTQUFBO0FBRXBCLFlBQUE7UUFBQSxLQUFBLEdBQVE7UUFDUCxjQUFlLElBQUMsQ0FBQTtBQUNULGVBQU0sQ0FBQyxJQUFBLEdBQU8sV0FBWSxDQUFBLEtBQUEsQ0FBcEIsQ0FBQSxJQUFnQyxJQUFBLFlBQWdCLE9BQWhELElBQ1YsSUFBQSxZQUFnQixLQUFoQixJQUEwQixJQUFJLENBQUMsUUFBTCxDQUFBLENBRHRCO1lBQVIsRUFBRTtRQUFNO2VBRVIsSUFBQyxDQUFBLFVBQUQsR0FBYyxXQUFXLENBQUMsTUFBWixDQUFtQixDQUFuQixFQUFzQixLQUF0QjtJQU5NOztvQkFVeEIsaUJBQUEsR0FBbUIsU0FBQyxJQUFEO1FBRWYsSUFBRyxDQUFJLElBQUMsQ0FBQSxJQUFSO1lBQ0ksSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJO1lBQ1osSUFBRyxJQUFDLENBQUEsWUFBSjtnQkFDSSxJQUFDLENBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFYLENBQWdCLElBQUksT0FBSixDQUFlLElBQUMsQ0FBQSxZQUFGLEdBQWUseUJBQTdCLENBQWhCLEVBREo7YUFBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE1BQUo7Z0JBQ0QsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFJLE9BQUosQ0FBZSxJQUFELEdBQU0sK0NBQXBCLENBQWhCLEVBREM7O1lBRUwsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBWCxDQUFBO1lBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBbEIsQ0FBMEIsSUFBQyxDQUFBLElBQTNCLEVBUEo7O1FBUUEsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLEdBQWEsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLEdBQWE7UUFDMUIsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEdBQWM7ZUFDZCxJQUFDLENBQUEsSUFBSSxDQUFDLFFBQU4sR0FBaUI7SUFaRjs7b0JBa0JuQixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsUUFBQSxHQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBLENBQWQ7WUFDSSxRQUFRLENBQUMsS0FBVCxDQUFlLDZDQUFmLEVBREo7O1FBRUEsSUFBRyxhQUFBLEdBQWdCLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBTixDQUFlLGtCQUFmLENBQW5CO1lBQ0ksYUFBYSxDQUFDLEtBQWQsQ0FBb0IsNENBQXBCLEVBREo7O1FBR0EsSUFBQSxHQUFRLElBQUMsQ0FBQSxhQUFELENBQUE7UUFDUixLQUFBLEdBQVEsSUFBSSxpQkFBSixDQUFzQixJQUF0QjtRQUNSLElBQUEsR0FBUSxJQUFJLElBQUosQ0FBUyxFQUFULEVBQWEsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLElBQUMsQ0FBQSxJQUFGLENBQVgsQ0FBYjtRQUNSLElBQUEsR0FBUTtRQUNSLENBQUMsQ0FBQyxVQUFGLEdBQWUsSUFBSSxDQUFDLFNBQUwsQ0FBZSxDQUFDLENBQUMsS0FBakI7UUFFZixJQUFDLENBQUEsc0JBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxVQUFELENBQVksSUFBWjtRQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixFQUFnQixDQUFoQjtRQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQjtRQUNBLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQjtRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixHQUFlO1FBQ2YsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBbEIsQ0FBdUIsS0FBdkI7UUFFQSxJQUFHLElBQUMsQ0FBQSxNQUFKO1lBQ0ksVUFBQSxHQUFhLElBQUksaUJBQUosQ0FBc0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFiLENBQTBCLFlBQTFCLEVBQXdDO2dCQUFBLE9BQUEsRUFBUyxLQUFUO2FBQXhDLENBQXRCO1lBQ2IsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBbEIsQ0FBMEIsSUFBSSxPQUFKLENBQVksS0FBWixFQUFtQixVQUFuQixDQUExQjtZQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBWixDQUFpQixJQUFJLEtBQUosQ0FBVSxVQUFWLENBQWpCO1lBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsTUFBWCxFQUpKOztRQU1BLFFBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWlCLENBQUMsT0FBbEIsYUFBMEIsSUFBQyxDQUFBLFVBQTNCO1FBRUEsS0FBQSxHQUFRLElBQUksTUFBSixDQUFXLElBQUksSUFBSixDQUFTLElBQVQsRUFBZSxJQUFmLENBQVg7UUFDUixJQUFxRSxJQUFDLENBQUEsUUFBdEU7WUFBQSxLQUFBLEdBQVEsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLFFBQVosRUFBc0IsS0FBdEIsRUFBNkIsSUFBN0IsRUFBbUM7Z0JBQUcsbUJBQUQsSUFBQyxDQUFBLGlCQUFIO2FBQW5DLEVBQVI7O2VBQ0EsS0FBSyxDQUFDLGtCQUFOLENBQXlCLENBQXpCO0lBL0JTOzs7O0dBbkptQjs7QUEwTHBDLE9BQU8sQ0FBQyxpQkFBUixHQUFrQzs7O0lBRWpCLDJCQUFDLE1BQUQsRUFBVSxPQUFWO1FBQUMsSUFBQyxDQUFBLFNBQUQ7UUFBUyxJQUFDLENBQUEsU0FBRDtRQUNuQixJQUFDLENBQUEsV0FBRCxDQUFBO0lBRFM7O2dDQUdiLFFBQUEsR0FBVSxDQUFDLFFBQUQsRUFBVyxRQUFYOztnQ0FFVixXQUFBLEdBQWE7O2dDQUNiLEtBQUEsR0FBaUI7O2dDQUNqQixVQUFBLEdBQWE7O2dDQUViLFdBQUEsR0FBYSxTQUFBO1FBQ1QsSUFBRyxxQkFBQSxJQUFhLElBQUMsQ0FBQSxNQUFELFlBQW1CLHdCQUFuQzttQkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBYyw2RUFBZCxFQURKOztJQURTOztnQ0FJYixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUkscUJBQUo7UUFDUixJQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBVCxLQUFtQixDQUF0QjttQkFDSSxJQUFDLENBQUEsS0FBRCxDQUFVLHFCQUFELEdBQXVCLHdDQUFoQyxFQURKOztJQURROzs7O0dBZjRDOztBQXlCNUQsT0FBTyxDQUFDLGlCQUFSLEdBQWtDOzs7Ozs7O2dDQUU5QixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBWixFQUFlLFFBQWY7UUFDQSxDQUFDLENBQUMsZUFBRixHQUFvQjtRQUVwQixJQUFBLEdBQU87UUFDUCxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQWEsSUFBQyxDQUFBLEdBQUYsR0FBTSxTQUFsQixDQUFWO1FBQ0EsSUFBdUMsbUJBQXZDO1lBQUEsSUFBSSxDQUFDLElBQUwsYUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBb0IsQ0FBcEIsQ0FBVixFQUFBOztRQUVBLElBQUcsNERBQUg7WUFDSSxJQUFvQyxJQUFDLENBQUEsTUFBRCxLQUFXLElBQS9DO2dCQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxRQUFWLENBQVYsRUFBQTs7WUFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFsQixDQUFWLEVBRko7O1FBSUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBVjtlQUNBO0lBYlM7Ozs7R0FGMkM7O0FBaUI1RCxPQUFPLENBQUMsWUFBUixHQUE2Qjs7O0lBRVosc0JBQUMsY0FBRCxFQUFrQixZQUFsQjtRQUFDLElBQUMsQ0FBQSxpQkFBRDtRQUFpQixJQUFDLENBQUEsZUFBRDtJQUFsQjs7MkJBRWIsUUFBQSxHQUFVLENBQUMsZ0JBQUQsRUFBbUIsY0FBbkI7OzJCQUVWLFdBQUEsR0FBYSxTQUFDLENBQUQ7QUFDVCxZQUFBO1FBQUEsSUFBQSxHQUFPO1FBRVAsSUFBRywyQkFBSDtZQUNJLElBQUksQ0FBQyxJQUFMLGFBQVUsSUFBQyxDQUFBLGNBQWMsQ0FBQyxXQUFoQixDQUE0QixDQUE1QixDQUFWO1lBQ0EsSUFBNEIseUJBQTVCO2dCQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQVYsRUFBQTthQUZKOztRQUlBLElBQUcseUJBQUg7WUFDSSxJQUFJLENBQUMsSUFBTCxhQUFVLElBQUMsQ0FBQSxZQUFZLENBQUMsV0FBZCxDQUEwQixDQUExQixDQUFWLEVBREo7O2VBR0E7SUFWUzs7OztHQU5pQzs7QUF3QmxELE9BQU8sQ0FBQyxpQkFBUixHQUFrQzs7Ozs7OztnQ0FFOUIsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7UUFBQSxJQUFDLENBQUEsVUFBRCxDQUFZLENBQVosRUFBZSxRQUFmO1FBRUEsSUFBQSxHQUFPO1FBQ1AsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFhLElBQUMsQ0FBQSxHQUFGLEdBQU0sU0FBbEIsQ0FBVjtRQUNBLElBQWtDLElBQUEsWUFBYSx3QkFBL0M7WUFBQSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsVUFBVixDQUFWLEVBQUE7O1FBRUEsSUFBRyxDQUFBLENBQUEsSUFBQSxZQUFpQix3QkFBakIsQ0FBQSxJQUNFLENBQUMsSUFBQyxDQUFBLE1BQUQsWUFBbUIsTUFBbkIsSUFBNkIsSUFBQyxDQUFBLE1BQUQsWUFBbUIsS0FBakQsQ0FETDtZQUdJLElBQUcsSUFBQyxDQUFBLE1BQUQsWUFBbUIsS0FBbkIsSUFBNkIsQ0FBSSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQTVDO2dCQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFjLHNDQUFkLEVBREo7O1lBSUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsQ0FBVjtZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsR0FBNEIsU0FSaEM7O1FBVUEsSUFBRywwQkFBQSxJQUFrQixJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsWUFBd0IsS0FBN0M7WUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLGtCQUFSLENBQTJCLENBQTNCLEVBQThCLFNBQTlCLENBQVosRUFEWDtTQUFBLE1BQUE7WUFHSSxJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBb0IsQ0FBcEIsQ0FBWixFQUhYOztRQUtBLElBQWdELDREQUFoRDtZQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxRQUFBLEdBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUEzQixDQUFWLEVBQUE7O1FBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBVjtlQUNBO0lBeEJTOzs7O0dBRjJDOztBQTRCNUQsT0FBTyxDQUFDLHNCQUFSLEdBQXVDOzs7Ozs7Ozs7R0FBK0I7O0FBRXRFLE9BQU8sQ0FBQyx3QkFBUixHQUF5Qzs7Ozs7Ozs7O0dBQWlDOztBQUUxRSxPQUFPLENBQUMsb0JBQVIsR0FBcUM7Ozs7Ozs7OztHQUE2Qjs7QUFFbEUsT0FBTyxDQUFDLG1CQUFSLEdBQW9DOzs7SUFFbkIsNkJBQUMsVUFBRDtRQUFDLElBQUMsQ0FBQSxhQUFEO0lBQUQ7O2tDQUViLFFBQUEsR0FBVSxDQUFDLFlBQUQ7O2tDQUVWLFdBQUEsR0FBYSxTQUFDLENBQUQ7QUFDVCxZQUFBO1FBQUEsSUFBQSxHQUFPO1FBQ1AsQ0FBQyxDQUFDLE1BQUYsSUFBWTtRQUNaLFlBQUE7O0FBQWdCO0FBQUE7aUJBQUEsd0NBQUE7OzZCQUFBLFNBQVMsQ0FBQyxrQkFBVixDQUE2QixDQUE3QixFQUFnQyxVQUFoQztBQUFBOzs7UUFFaEIsSUFBRyxJQUFDLENBQUEsVUFBVSxDQUFDLE1BQVosS0FBc0IsQ0FBekI7WUFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBQSxHQUFNLENBQUMsQ0FBQyxNQUFsQixDQUFWO0FBQ0EsaUJBQUEsZ0VBQUE7O2dCQUNJLElBQXlDLEtBQXpDO29CQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFBLEdBQU0sQ0FBQyxDQUFDLE1BQWxCLENBQVYsRUFBQTs7Z0JBQ0EsSUFBSSxDQUFDLElBQUwsYUFBVSxTQUFWO0FBRko7WUFHQSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBVixDQUFWLEVBTEo7U0FBQSxNQUFBO1lBT0ksSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBVixFQVBKOztlQVFBO0lBYlM7Ozs7R0FOK0M7O0FBcUJoRSxPQUFPLENBQUMsbUJBQVIsR0FBb0M7Ozs7Ozs7OztHQUE0Qjs7QUFFaEUsT0FBTyxDQUFDLG1CQUFSLEdBQW9DOzs7Ozs7Ozs7R0FBNEI7O0FBRWhFLE9BQU8sQ0FBQyxlQUFSLEdBQWdDOzs7SUFDZix5QkFBQyxRQUFELEVBQVksS0FBWixFQUFvQixzQkFBcEI7UUFBQyxJQUFDLENBQUEsV0FBRDtRQUFXLElBQUMsQ0FBQSxRQUFEO1FBQVEsSUFBQyxDQUFBLHdCQUFEO1FBRTdCLElBQUMsQ0FBQSxVQUFELEdBQWlCLGtCQUFILEdBQWdCLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBdkIsR0FBa0MsSUFBQyxDQUFBLFFBQVEsQ0FBQztJQUZqRDs7OEJBSWIsUUFBQSxHQUFVLENBQUMsVUFBRCxFQUFhLE9BQWI7OzhCQUVWLFdBQUEsR0FBYSxTQUFDLENBQUQ7QUFDVCxZQUFBO1FBQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFSLENBQWEsSUFBQyxDQUFBLFVBQWQsRUFBMEIsSUFBQyxDQUFBLHFCQUEzQjtRQUNBLElBQUEsR0FBTztRQUNQLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQXBCLENBQVY7UUFDQSxJQUE2QyxrQkFBN0M7WUFBQSxJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBQSxHQUFPLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBeEIsQ0FBVixFQUFBOztlQUNBO0lBTFM7Ozs7R0FQdUM7O0FBY3hELE9BQU8sQ0FBQyxlQUFSLEdBQWdDOzs7SUFDZix5QkFBQyxRQUFELEVBQVcsS0FBWDtRQUNULGlEQUFNLFFBQU4sRUFBZ0IsS0FBaEIsRUFBdUIsUUFBdkI7SUFEUzs7OEJBR2IsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUdULFlBQUE7UUFBQSxJQUFHLFFBQUEsSUFBQyxDQUFBLFVBQUQsRUFBQSxhQUFlLENBQUMsQ0FBQyxlQUFqQixFQUFBLElBQUEsTUFBQSxDQUFBLElBQW9DLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBUixDQUFjLElBQUMsQ0FBQSxVQUFmLENBQXZDO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxHQUFBLEdBQUksSUFBQyxDQUFBLFVBQUwsR0FBZ0IsNkJBQXZCLEVBREo7U0FBQSxNQUFBO1lBR0ksQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFsQixDQUF1QixJQUFDLENBQUEsVUFBeEIsRUFISjs7ZUFJQSxpREFBTSxDQUFOO0lBUFM7Ozs7R0FKdUM7O0FBYXhELE9BQU8sQ0FBQyxzQkFBUixHQUF1Qzs7Ozs7Ozs7O0dBQStCOztBQUV0RSxPQUFPLENBQUMsd0JBQVIsR0FBeUM7Ozs7Ozs7OztHQUFpQzs7QUFFMUUsT0FBTyxDQUFDLGVBQVIsR0FBZ0M7OztJQUNmLHlCQUFDLEtBQUQsRUFBUSxRQUFSO1FBQ1QsaURBQU0sS0FBTixFQUFhLFFBQWIsRUFBdUIsUUFBdkI7SUFEUzs7OztHQUR1Qzs7QUFheEQsT0FBTyxDQUFDLE1BQVIsR0FBdUI7OztJQUVOLGdCQUFDLFNBQUQsRUFBWSxNQUFaLEVBQW9CLE9BQXBCLEVBQThCLE9BQTlCO1FBQUMsSUFBQyxDQUFBLFdBQUQ7UUFBVyxJQUFDLENBQUEsUUFBRDtRQUFRLElBQUMsQ0FBQSxVQUFEOztZQUFVLFVBQVU7O1FBQ2hELElBQUMsQ0FBQSxnQkFBQSxLQUFGLEVBQVMsSUFBQyxDQUFBLHFCQUFBLFVBQVYsRUFBc0IsSUFBQyxDQUFBLHdCQUFBLGFBQXZCLEVBQXNDLElBQUMsQ0FBQSw0QkFBQTtJQUQ5Qjs7cUJBR2IsUUFBQSxHQUFVLENBQUMsVUFBRCxFQUFhLE9BQWI7O3FCQUVWLFdBQUEsR0FBYSxTQUFDLENBQUQ7NEJBQ1QsQ0FBQyxDQUFFLGVBQUgsS0FBWSxTQUFaLElBQTBCLHNCQUExQixJQUF3QyxDQUFDLElBQUMsQ0FBQSxpQkFBRCxJQUFzQixhQUFPLElBQUMsQ0FBQSxPQUFSLEVBQUEsR0FBQSxNQUF2QjtJQUQvQjs7cUJBR2Isa0JBQUEsR0FBb0IsU0FBQyxDQUFELEVBQUksT0FBSjtRQUNoQixJQUFHLE1BQU0sQ0FBQSxTQUFFLENBQUEsY0FBYyxDQUFDLElBQXZCLENBQTRCLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBcEMsRUFBK0MsT0FBTyxDQUFDLEtBQXZELENBQUEsSUFDRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVUsQ0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVUsQ0FBQSxPQUFPLENBQUMsS0FBUixDQUFsQixDQUFpQyxDQUFDLElBQXBELEtBQTRELFFBRGpFO21CQUVJLE9BQU8sQ0FBQyxLQUFSLENBQWMsR0FBQSxHQUFJLE9BQU8sQ0FBQyxLQUFaLEdBQWtCLGdCQUFoQyxFQUZKOztJQURnQjs7cUJBS3BCLE9BQUEsR0FBUyxTQUFDLElBQUQ7ZUFDTCxJQUFFLENBQUcsSUFBQyxDQUFBLE9BQUQsS0FBWSxRQUFmLEdBQTZCLE9BQTdCLEdBQTBDLFVBQTFDLENBQXFELENBQUMsT0FBeEQsQ0FBZ0UsSUFBaEU7SUFESzs7cUJBR1QsVUFBQSxHQUFZLFNBQUMsQ0FBRDtlQUNSLFVBQUEsQ0FBVyxDQUFYLEVBQWMsSUFBZCxFQUFvQixVQUFwQjtJQURROztxQkFRWixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsT0FBQSxHQUFVLElBQUMsQ0FBQSxRQUFELFlBQXFCLEtBQWxDO1lBQ0ksSUFBaUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQUEsQ0FBQSxJQUF1QixJQUFDLENBQUEsUUFBUSxDQUFDLFFBQVYsQ0FBQSxDQUF4RDtBQUFBLHVCQUFPLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixDQUFyQixFQUFQOztZQUNBLElBQWlDLElBQUMsQ0FBQSxRQUFRLENBQUMsUUFBVixDQUFBLENBQWpDO0FBQUEsdUJBQU8sSUFBQyxDQUFBLGFBQUQsQ0FBcUIsQ0FBckIsRUFBUDs7WUFDQSxZQUFpQyxJQUFDLENBQUEsUUFBRCxLQUFhLEtBQWIsSUFBQSxJQUFBLEtBQW9CLEtBQXBCLElBQUEsSUFBQSxLQUEyQixJQUE1RDtBQUFBLHVCQUFPLElBQUMsQ0FBQSxrQkFBRCxDQUFxQixDQUFyQixFQUFQOztZQUNBLFlBQWlDLElBQUMsQ0FBQSxRQUFELEtBQWEsS0FBYixJQUFBLElBQUEsS0FBb0IsS0FBcEIsSUFBQSxJQUFBLEtBQTJCLEtBQTVEO0FBQUEsdUJBQU8sSUFBQyxDQUFBLGtCQUFELENBQXFCLENBQXJCLEVBQVA7YUFKSjs7UUFLQSxJQUFHLElBQUMsQ0FBQSxLQUFELFlBQWtCLElBQXJCO1lBQ0ksSUFBRyxJQUFDLENBQUEsS0FBSyxFQUFDLE1BQUQsRUFBVDtnQkFDSSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsR0FBZSxJQUFDLENBQUEsUUFBUSxDQUFDO2dCQUN6QixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsR0FBZSxJQUFDLENBQUEsUUFBUSxDQUFDLFVBQVcsQ0FBQSxDQUFBO2dCQUNwQyxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsR0FBa0IsSUFBQyxDQUFBLFNBSHZCO2FBQUEsTUFJSyxxREFBdUIsQ0FBRSxnQkFBdEIsSUFBZ0MsQ0FBbkM7Z0JBQ0QsT0FBbUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUE3QyxFQUFDLHNGQUFELEVBQWdCLHFCQUFoQixFQUEyQjtnQkFDM0IsMkNBQWlCLENBQUUsZUFBaEIsS0FBeUIsV0FBNUI7b0JBQ0ksSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLEdBQWUsSUFBSSxLQUFKLENBQVUsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFwQixFQUEwQixVQUExQjtvQkFDZixJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsR0FBZTtvQkFDZixJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsR0FBa0IsSUFBQyxDQUFBLFNBSHZCO2lCQUZDO2FBTFQ7O1FBV0EsSUFBQSxDQUFPLElBQUMsQ0FBQSxPQUFSO1lBQ0ksT0FBQSxHQUFVLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixDQUFBO1lBQ1YsSUFBQSxDQUFPLE9BQU8sQ0FBQyxZQUFSLENBQUEsQ0FBUDtnQkFDSSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsQ0FBZ0IsR0FBQSxHQUFHLENBQUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQWtCLENBQWxCLENBQUQsQ0FBSCxHQUF3QixxQkFBeEMsRUFESjs7WUFFQSxJQUFBLGdEQUFPLE9BQU8sQ0FBQyx5QkFBZjtnQkFFSSxJQUFHLElBQUMsQ0FBQSxpQkFBSjtvQkFDSSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsQ0FBcEIsRUFBdUIsT0FBdkI7b0JBQ0EsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFSLENBQVksT0FBTyxDQUFDLEtBQXBCLEVBQTJCLElBQUMsQ0FBQSxpQkFBNUIsRUFGSjtpQkFBQSxNQUdLLElBQUcsSUFBQyxDQUFBLEtBQUo7b0JBQ0QsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFSLENBQVksT0FBTyxDQUFDLEtBQXBCLEVBQTJCLEtBQTNCLEVBREM7aUJBQUEsTUFBQTtvQkFHRCxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsQ0FBcEIsRUFBdUIsT0FBdkI7b0JBQ0EsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFSLENBQWEsT0FBTyxDQUFDLEtBQXJCLEVBSkM7aUJBTFQ7YUFKSjs7UUFlQSxHQUFBLEdBQU0sSUFBQyxDQUFBLEtBQUssQ0FBQyxrQkFBUCxDQUEwQixDQUExQixFQUE2QixVQUE3QjtRQUNOLElBQTBCLE9BQUEsSUFBWSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsWUFBMEIsR0FBaEU7WUFBQSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsR0FBa0IsS0FBbEI7O1FBQ0EsWUFBQSxHQUFlLElBQUMsQ0FBQSxRQUFRLENBQUMsa0JBQVYsQ0FBNkIsQ0FBN0IsRUFBZ0MsVUFBaEM7UUFFZixJQUFHLElBQUMsQ0FBQSxPQUFELEtBQVksUUFBZjtZQUNJLFdBQUcsZUFBQSxDQUFnQixZQUFoQixDQUFBLEVBQUEsYUFBaUMsWUFBakMsRUFBQSxJQUFBLE1BQUg7Z0JBQ0ksWUFBWSxDQUFDLE9BQWIsQ0FBcUIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBQXJCO2dCQUNBLFlBQVksQ0FBQyxJQUFiLENBQWtCLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFsQixFQUZKOztBQUdBLG1CQUFPLFlBQVksQ0FBQyxNQUFiLENBQW9CLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFwQixFQUFxQyxHQUFyQyxFQUpYOztRQU1BLE1BQUEsR0FBUyxZQUFZLENBQUMsTUFBYixDQUFvQixJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUEsR0FBRyxDQUFFLElBQUMsQ0FBQSxPQUFELElBQVksR0FBZCxDQUFILEdBQXNCLEdBQWhDLENBQXBCLEVBQXlELEdBQXpEO1FBQ1QsSUFBRyxDQUFDLENBQUMsS0FBRixJQUFXLFVBQWQ7bUJBQThCLE9BQTlCO1NBQUEsTUFBQTttQkFBMEMsSUFBQyxDQUFBLFlBQUQsQ0FBYyxNQUFkLEVBQTFDOztJQTVDUzs7cUJBdURiLG1CQUFBLEdBQXFCLFNBQUMsQ0FBRDtBQUVqQixZQUFBO1FBQUEsR0FBQSxHQUFZLENBQUMsQ0FBQyxLQUFGLEtBQVc7UUFDdEIsUUFBVztRQUNYLFVBQVcsSUFBQyxDQUFBLFFBQVEsQ0FBQztRQUV0QixJQUFBLENBQU8sQ0FBQSxJQUFBLEdBQU8sT0FBTyxDQUFDLE1BQWYsQ0FBUDtZQUNJLElBQUEsR0FBTyxLQUFLLENBQUMsa0JBQU4sQ0FBeUIsQ0FBekI7WUFDQSxJQUFHLENBQUMsQ0FBQyxLQUFGLElBQVcsUUFBZDt1QkFBNEIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkLEVBQTVCO2FBQUEsTUFBQTt1QkFBb0QsS0FBcEQ7YUFGWDs7UUFJQyxNQUFPO1FBRVIsSUFBRyxJQUFBLEtBQVEsQ0FBUixJQUFjLEdBQUEsWUFBZSxTQUFoQztZQUNJLEdBQUcsQ0FBQyxLQUFKLENBQVUsd0NBQVYsRUFESjs7UUFHQSxRQUFBLEdBQVcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxRQUFWLENBQUE7UUFFWCxJQUFHLEdBQUEsSUFBUSxJQUFBLEtBQVEsQ0FBaEIsSUFBc0IsQ0FBQSxDQUFBLEdBQUEsWUFBbUIsS0FBbkIsQ0FBekI7WUFHSSxZQUFBLEdBQWU7WUFDZixJQUFHLEdBQUEsWUFBZSxNQUFmLElBQTBCLEdBQUcsQ0FBQyxPQUFKLEtBQWUsUUFBNUM7Z0JBRUksT0FBc0MsR0FBdEMsZUFBQyxVQUFpQixXQUFOLEtBQVosRUFBK0IsV0FBUDtnQkFDeEIsSUFBRyxHQUFBLFlBQWUsTUFBbEI7b0JBQ0ksWUFBQSxHQUFlLEdBQUcsQ0FBQztvQkFDbkIsR0FBQSxHQUFNLEdBQUcsQ0FBQyxTQUZkO2lCQUhKO2FBQUEsTUFBQTtnQkFPSSxJQUFHLEdBQUEsWUFBZSxNQUFsQjtvQkFDSSxZQUFBLEdBQWUsR0FBRyxDQUFDO29CQUNuQixHQUFBLEdBQU0sR0FBRyxDQUFDLFNBRmQ7O2dCQUdBLEdBQUEsR0FBUyxRQUFILEdBQ0MsR0FBRyxFQUFDLElBQUQsRUFBTixHQUNJLEdBQUcsQ0FBQyxVQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFEdEIsR0FHSSxJQUFJLFlBQUosQ0FBaUIsR0FBRyxDQUFDLE1BQUosQ0FBQSxDQUFZLENBQUMsS0FBOUIsQ0FKRixHQU9GLElBQUksYUFBSixDQUFrQixDQUFsQixFQWpCUjs7WUFrQkEsR0FBQSxHQUFNLEdBQUcsQ0FBQyxNQUFKLENBQUEsQ0FBQSxZQUF3QjtZQUM5QixLQUFBLEdBQVEsSUFBSSxLQUFKLENBQVUsS0FBVjtZQUNSLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBakIsQ0FBc0IsSUFBSSxDQUFJLEdBQUgsR0FBWSxNQUFaLEdBQXdCLEtBQXpCLENBQUosQ0FBb0MsR0FBcEMsQ0FBdEI7WUFDQSxPQUFBLEdBQVUsY0FBQSxDQUFlLEdBQUcsQ0FBQyxNQUFKLENBQUEsQ0FBWSxDQUFDLEtBQTVCO1lBQ1YsSUFBcUIsT0FBckI7Z0JBQUEsR0FBRyxDQUFDLEtBQUosQ0FBVSxPQUFWLEVBQUE7O1lBQ0EsSUFBMkMsWUFBM0M7Z0JBQUEsS0FBQSxHQUFRLElBQUksRUFBSixDQUFPLEdBQVAsRUFBWSxLQUFaLEVBQW1CLFlBQW5CLEVBQVI7O0FBQ0EsbUJBQU8sSUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE2QjtnQkFBQSxLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQVI7YUFBN0IsQ0FBMkMsQ0FBQyxrQkFBNUMsQ0FBK0QsQ0FBL0QsRUFBa0UsU0FBbEUsRUE1Qlg7O1FBOEJBLElBQUEsR0FBVyxLQUFLLENBQUMsa0JBQU4sQ0FBeUIsQ0FBekIsRUFBNEIsVUFBNUI7UUFDWCxRQUFBLEdBQVcsZUFBQSxDQUFnQixJQUFoQjtRQUNYLE9BQUEsR0FBVztRQUNYLFdBQUEsR0FBYztRQUVkLElBQUcsQ0FBQSxDQUFBLEtBQUssQ0FBQyxNQUFOLENBQUEsQ0FBQSxZQUE4QixpQkFBOUIsQ0FBQSxJQUFtRCxJQUFDLENBQUEsUUFBUSxDQUFDLE9BQVYsQ0FBa0IsUUFBbEIsQ0FBdEQ7WUFDSSxPQUFPLENBQUMsSUFBUixDQUFjLENBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBWSxDQUFFLEdBQUEsR0FBTSxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsS0FBckIsQ0FBUixDQUFBLEdBQW9DLEtBQWhELENBQXVELFNBQUEsV0FBQSxJQUFBLENBQUEsQ0FBckU7WUFDQSxJQUFBLEdBQU8sQ0FBQyxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBRDtZQUNQLFFBQUEsR0FBVyxJQUhmOztBQUtBLGFBQUEsbURBQUE7O1lBRUksR0FBQSxHQUFNO1lBRU4sSUFBRyxDQUFJLFdBQUosSUFBb0IsR0FBQSxZQUFlLEtBQXRDO2dCQUVJLElBQUEsR0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQVQsQ0FBQSxDQUFpQixDQUFDO2dCQUN6QixHQUFBLEdBQU0sR0FBRyxDQUFDLE1BQUosQ0FBQTtnQkFDTixHQUFBLEdBQVMsSUFBRCxHQUFNLE1BQU4sR0FBWSxRQUFaLEdBQXFCLFlBQXJCLEdBQWdDLENBQUUsT0FBQSxDQUFRLE9BQVIsRUFBaUIsQ0FBakIsQ0FBRixDQUFoQyxHQUFzRCxRQUF0RCxHQUE4RCxRQUE5RCxHQUF1RSxJQUF2RSxHQUEyRTtnQkFDbkYsSUFBRyxJQUFBLEdBQU8sSUFBQSxHQUFPLENBQVAsR0FBVyxDQUFyQjtvQkFDSSxJQUFBLEdBQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFSLENBQXFCLEdBQXJCLEVBQTBCO3dCQUFBLE1BQUEsRUFBUSxJQUFSO3FCQUExQjtvQkFDUCxHQUFBLElBQU8sSUFBQSxHQUFLLElBQUwsR0FBVSxLQUFWLEdBQWUsUUFBZixHQUF3QixZQUF4QixHQUFvQyxJQUFwQyxHQUF5QyxPQUF6QyxHQUFnRCxJQUFoRCxHQUFxRCxLQUFyRCxHQUEwRCxDQUExRCxHQUE0RCxRQUZ2RTtpQkFBQSxNQUFBO29CQUlJLEdBQUEsSUFBTyxTQUpYOztnQkFLQSxHQUFBLEdBQVUsSUFBSSxPQUFKLENBQVksR0FBWjtnQkFDVixXQUFBLEdBQWlCLElBQUQsR0FBTSxLQVgxQjthQUFBLE1BYUssSUFBRyxDQUFJLFdBQUosSUFBb0IsR0FBQSxZQUFlLFNBQXRDO2dCQUVELElBQUcsSUFBQSxHQUFPLElBQUEsR0FBTyxDQUFQLEdBQVcsQ0FBckI7b0JBQ0ksSUFBRyxJQUFBLEtBQVEsQ0FBWDt3QkFDSSxXQUFBLEdBQWlCLFFBQUQsR0FBVSxjQUQ5QjtxQkFBQSxNQUFBO3dCQUdJLElBQUEsR0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsR0FBckIsRUFBMEI7NEJBQUEsTUFBQSxFQUFRLElBQVI7eUJBQTFCO3dCQUNQLEdBQUEsR0FBTSxJQUFJLE9BQUosQ0FBZSxJQUFELEdBQU0sS0FBTixHQUFXLFFBQVgsR0FBb0IsWUFBcEIsR0FBZ0MsSUFBOUM7d0JBQ04sV0FBQSxHQUFpQixJQUFELEdBQU07d0JBQ3RCLE9BQU8sQ0FBQyxJQUFSLENBQWEsR0FBRyxDQUFDLGtCQUFKLENBQXVCLENBQXZCLEVBQTBCLFVBQTFCLENBQWIsRUFOSjtxQkFESjs7QUFRQSx5QkFWQzthQUFBLE1BQUE7Z0JBYUQsSUFBRyxHQUFBLFlBQWUsS0FBZixJQUF3QixHQUFBLFlBQWUsU0FBMUM7b0JBQ0ksR0FBRyxDQUFDLEtBQUosQ0FBVSw0REFBVixFQURKOztnQkFFQSxZQUFBLEdBQWU7Z0JBQ2YsSUFBRyxHQUFBLFlBQWUsTUFBZixJQUEwQixHQUFHLENBQUMsT0FBSixLQUFlLFFBQTVDO29CQUNJLE9BQXNDLEdBQXRDLGVBQUMsVUFBaUIsV0FBTixLQUFaLEVBQStCLFdBQVA7b0JBQ3hCLElBQUcsR0FBQSxZQUFlLE1BQWxCO3dCQUNJLFlBQUEsR0FBZSxHQUFHLENBQUM7d0JBQ25CLEdBQUEsR0FBTSxHQUFHLENBQUMsU0FGZDtxQkFGSjtpQkFBQSxNQUFBO29CQU1JLElBQUcsR0FBQSxZQUFlLE1BQWxCO3dCQUNJLFlBQUEsR0FBZSxHQUFHLENBQUM7d0JBQ25CLEdBQUEsR0FBTSxHQUFHLENBQUMsU0FGZDs7b0JBR0EsR0FBQSxHQUFTLFFBQUgsR0FDQyxHQUFHLEVBQUMsSUFBRCxFQUFOLEdBQ0ksR0FBRyxDQUFDLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUR0QixHQUdJLElBQUksWUFBSixDQUFpQixHQUFHLENBQUMsTUFBSixDQUFBLENBQVksQ0FBQyxLQUE5QixDQUpGLEdBTUYsSUFBSSxPQUFKLENBQVksV0FBQSxJQUFlLEdBQTNCLEVBZlI7O2dCQWlCQSxJQUFBLEdBQU8sR0FBRyxDQUFDLE1BQUosQ0FBQSxDQUFZLENBQUM7Z0JBQ3BCLEdBQUEsR0FBTSxHQUFHLENBQUMsTUFBSixDQUFBLENBQUEsWUFBd0I7Z0JBQzlCLEdBQUEsR0FBTSxJQUFJLEtBQUosQ0FBVSxJQUFJLE9BQUosQ0FBWSxRQUFaLENBQVYsRUFBaUMsQ0FBQyxJQUFJLENBQUksR0FBSCxHQUFZLE1BQVosR0FBd0IsS0FBekIsQ0FBSixDQUFvQyxHQUFwQyxDQUFELENBQWpDO2dCQUNOLElBQXVDLFlBQXZDO29CQUFBLEdBQUEsR0FBTSxJQUFJLEVBQUosQ0FBTyxHQUFQLEVBQVksR0FBWixFQUFpQixZQUFqQixFQUFOO2lCQXBDQzs7WUFzQ0wsSUFBRyxZQUFIO2dCQUNJLE9BQUEsR0FBVSxjQUFBLENBQWUsSUFBZjtnQkFDVixJQUFxQixPQUFyQjtvQkFBQSxHQUFHLENBQUMsS0FBSixDQUFVLE9BQVYsRUFBQTtpQkFGSjs7WUFJQSxPQUFPLENBQUMsSUFBUixDQUFhLElBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsR0FBaEIsRUFBcUIsSUFBckIsRUFBMkI7Z0JBQUEsS0FBQSxFQUFPLElBQUMsQ0FBQSxLQUFSO2dCQUFlLFVBQUEsRUFBWSxJQUEzQjthQUEzQixDQUEwRCxDQUFDLGtCQUEzRCxDQUE4RSxDQUE5RSxFQUFpRixVQUFqRixDQUFiO0FBM0RKO1FBNkRBLElBQUEsQ0FBQSxDQUF5QixHQUFBLElBQU8sSUFBQyxDQUFBLFVBQWpDLENBQUE7WUFBQSxPQUFPLENBQUMsSUFBUixDQUFhLElBQWIsRUFBQTs7UUFDQSxTQUFBLEdBQVksSUFBQyxDQUFBLGtCQUFELENBQW9CLE9BQXBCLEVBQTZCLElBQTdCO1FBQ1osSUFBRyxDQUFDLENBQUMsS0FBRixHQUFVLFVBQWI7bUJBQTZCLFVBQTdCO1NBQUEsTUFBQTttQkFBNEMsSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkLEVBQTVDOztJQXhIaUI7O3FCQTZIckIsa0JBQUEsR0FBb0IsU0FBQyxDQUFEO0FBRWhCLFlBQUE7UUFBQSxPQUFnQixJQUFDLENBQUEsUUFBUSxDQUFDLGNBQVYsQ0FBeUIsQ0FBekIsQ0FBaEIsRUFBQyxjQUFELEVBQU87UUFFUCxJQUFHLENBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFwQixJQUErQixJQUFJLENBQUMsSUFBTCxZQUFxQixPQUFwRCxJQUNVLENBQUEsQ0FBQSxJQUFJLENBQUMsSUFBTCxZQUF5QixXQUF6QixDQURWLElBQ21ELENBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFSLENBQWMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUF4QixDQUQxRDtZQUVJLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixDQUFnQixpQkFBQSxHQUFrQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQTVCLEdBQWtDLDRCQUFsQyxHQUE4RCxJQUFDLENBQUEsT0FBL0QsR0FBdUUsMENBQXZGLEVBRko7O1FBR0EsSUFBRyxhQUFPLElBQUMsQ0FBQSxPQUFSLEVBQUEsR0FBQSxNQUFIO1lBQ0ksQ0FBQyxDQUFDLG1CQUFGLEdBQXdCO21CQUN4QixJQUFJLEVBQUosQ0FBTyxJQUFJLFNBQUosQ0FBYyxJQUFkLENBQVAsRUFBNEIsS0FBNUIsRUFBbUM7Z0JBQUEsSUFBQSxFQUFNLElBQU47YUFBbkMsQ0FBOEMsQ0FBQyxPQUEvQyxDQUF1RCxJQUFJLE1BQUosQ0FBVyxLQUFYLEVBQWtCLElBQUMsQ0FBQSxLQUFuQixFQUEwQixHQUExQixDQUF2RCxDQUFzRixDQUFDLGtCQUF2RixDQUEwRyxDQUExRyxFQUZKO1NBQUEsTUFBQTtZQUlJLFNBQUEsR0FBWSxJQUFJLEVBQUosQ0FBTyxJQUFDLENBQUEsT0FBUSxhQUFoQixFQUF3QixJQUF4QixFQUE4QixJQUFJLE1BQUosQ0FBVyxLQUFYLEVBQWtCLElBQUMsQ0FBQSxLQUFuQixFQUEwQixHQUExQixDQUE5QixDQUE2RCxDQUFDLGtCQUE5RCxDQUFpRixDQUFqRjtZQUNaLElBQUcsQ0FBQyxDQUFDLEtBQUYsSUFBVyxVQUFkO3VCQUE4QixVQUE5QjthQUFBLE1BQUE7dUJBQTZDLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZCxFQUE3QzthQUxKOztJQVBnQjs7cUJBaUJwQixrQkFBQSxHQUFvQixTQUFDLENBQUQ7QUFFaEIsWUFBQTtRQUFBLE9BQWdCLElBQUMsQ0FBQSxRQUFRLENBQUMsY0FBVixDQUF5QixDQUF6QixDQUFoQixFQUFDLGNBQUQsRUFBTztlQUNQLElBQUksTUFBSixDQUFXLElBQVgsRUFBaUIsSUFBSSxFQUFKLENBQU8sSUFBQyxDQUFBLE9BQVEsYUFBaEIsRUFBd0IsS0FBeEIsRUFBK0IsSUFBQyxDQUFBLEtBQWhDLENBQWpCLENBQXdELENBQUMsa0JBQXpELENBQTRFLENBQTVFO0lBSGdCOztxQkFPcEIsYUFBQSxHQUFlLFNBQUMsQ0FBRDtBQUVYLFlBQUE7ZUFBaUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBckIsQ0FBQSxFQUFoQyxPQUFRLGtCQUFNLGNBQUk7UUFDbkIsSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFrQixDQUFsQjtRQUNQLElBQUcsSUFBSDtZQUNJLE9BQXNCLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsRUFBYyxRQUFkLENBQXRCLENBQXRCLEVBQUMsa0JBQUQsRUFBVyxrQkFEZjtTQUFBLE1BQUE7WUFHSSxRQUFBLEdBQVcsT0FBQSxHQUFVLElBSHpCOztRQUlBLElBQUcsRUFBSDtZQUNJLG9CQUFHLElBQUksQ0FBRSxRQUFOLENBQUEsV0FBQSxJQUFxQixFQUFFLENBQUMsUUFBSCxDQUFBLENBQXhCO2dCQUNJLEVBQUEsR0FBSyxFQUFFLENBQUMsT0FBSCxDQUFXLENBQVgsQ0FBQSxHQUFnQjtnQkFDckIsSUFBQSxDQUFlLFNBQWY7b0JBQUEsRUFBQSxJQUFNLEVBQU47aUJBRko7YUFBQSxNQUFBO2dCQUlJLEVBQUEsR0FBSyxFQUFFLENBQUMsT0FBSCxDQUFXLENBQVgsRUFBYyxZQUFkLENBQUEsR0FBOEIsS0FBOUIsR0FBc0M7Z0JBQzNDLElBQUEsQ0FBb0IsU0FBcEI7b0JBQUEsRUFBQSxJQUFNLE9BQU47aUJBTEo7YUFESjtTQUFBLE1BQUE7WUFRSSxFQUFBLEdBQUssTUFSVDs7UUFTQSxPQUFtQixJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBYSxDQUFiLEVBQWdCLFVBQWhCLENBQW5CLEVBQUMsZ0JBQUQsRUFBUztRQUNULE1BQUEsR0FBUyxFQUFFLENBQUMsTUFBSCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsa0JBQUEsR0FBbUIsSUFBbkIsR0FBd0IsS0FBeEIsR0FBNkIsUUFBN0IsR0FBc0MsSUFBdEMsR0FBMEMsRUFBMUMsR0FBNkMsV0FBdkQsQ0FBVixFQUE4RSxNQUE5RSxFQUFzRixJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsQ0FBdEYsRUFBeUcsTUFBekc7UUFDVCxJQUFHLENBQUMsQ0FBQyxLQUFGLEdBQVUsU0FBYjttQkFBNEIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxNQUFkLEVBQTVCO1NBQUEsTUFBQTttQkFBc0QsT0FBdEQ7O0lBbkJXOzs7O0dBdE9tQjs7QUFxUXRDLE9BQU8sQ0FBQyxJQUFSLEdBQXFCOzs7SUFDSixjQUFDLE1BQUQsRUFBUyxJQUFULEVBQWUsR0FBZjtRQUNULElBQUMsQ0FBQSxNQUFELEdBQVUsTUFBQSxJQUFVO1FBQ3BCLElBQUMsQ0FBQSxJQUFELEdBQVUsSUFBQSxJQUFRLElBQUk7UUFDdEIsSUFBQyxDQUFBLEtBQUQsR0FBVSxHQUFBLEtBQU87UUFDakIsSUFBQyxDQUFBLFdBQUQsR0FBZSxDQUFDLENBQUMsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOLENBQWUsU0FBQyxJQUFEO21CQUM1QixDQUFDLElBQUEsWUFBZ0IsRUFBaEIsSUFBdUIsSUFBSSxDQUFDLE9BQUwsQ0FBQSxDQUF4QixDQUFBLElBQTJDLElBQUEsWUFBZ0I7UUFEL0IsQ0FBZjtJQUpSOzttQkFPYixRQUFBLEdBQVUsQ0FBQyxRQUFELEVBQVcsTUFBWDs7bUJBRVYsV0FBQSxHQUFhLFNBQUE7ZUFBRyxDQUFDLENBQUMsSUFBQyxDQUFBO0lBQU47O21CQUViLEtBQUEsR0FBTzs7bUJBRVAsU0FBQSxHQUFXLFNBQUMsV0FBRDtlQUFpQixJQUFJLEtBQUosQ0FBVSxXQUFWLEVBQXVCLElBQUMsQ0FBQSxJQUF4QixFQUE4QixJQUE5QjtJQUFqQjs7bUJBUVgsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUVULFlBQUE7UUFBQSxJQUFHLElBQUMsQ0FBQSxLQUFELDJDQUF5QixDQUFFLGVBQTlCO1lBQ0ksSUFBQyxDQUFBLE9BQUQsR0FBVyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUQ5Qjs7UUFHQSxJQUFHLElBQUMsQ0FBQSxLQUFELElBQVcsQ0FBSSxJQUFDLENBQUEsT0FBbkI7WUFDSSxJQUFDLENBQUEsT0FBRCxHQUFXO1lBQ1gsT0FBQSxHQUFVLElBQUksSUFBSixDQUFTLENBQUMsSUFBSSxLQUFKLENBQVUsSUFBSSxpQkFBSixDQUFzQixJQUFDLENBQUEsT0FBdkIsQ0FBVixDQUFELENBQVQsRUFBcUQsSUFBSSxLQUFKLENBQVUsQ0FBQyxJQUFELENBQVYsQ0FBckQ7WUFDVixTQUFBLEdBQVksSUFBSSxJQUFKLENBQVMsT0FBVCxFQUFrQixDQUFDLElBQUksV0FBTCxDQUFsQjtZQUNaLFNBQVMsQ0FBQywyQkFBVixDQUFzQyxJQUFDLENBQUEsWUFBdkM7QUFDQSxtQkFBTyxTQUFTLENBQUMsV0FBVixDQUFzQixDQUF0QixFQUxYOztRQU9BLENBQUMsQ0FBQyxLQUFGLEdBQWtCLEdBQUEsQ0FBSSxDQUFKLEVBQU8sWUFBUCxDQUFBLElBQXdCLElBQUMsQ0FBQSxTQUFELENBQVcsQ0FBQyxDQUFDLEtBQWI7UUFDMUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFSLEdBQWtCLEdBQUEsQ0FBSSxDQUFKLEVBQU8sYUFBUDtRQUNsQixDQUFDLENBQUMsTUFBRixJQUFrQjtRQUNsQixPQUFPLENBQUMsQ0FBQztRQUNULE9BQU8sQ0FBQyxDQUFDO1FBQ1QsTUFBQSxHQUFTO1FBQ1QsS0FBQSxHQUFTO0FBQ1Q7QUFBQSxhQUFBLHdDQUFBOztnQkFBMEIsQ0FBQSxDQUFBLEtBQUEsWUFBcUIsU0FBckI7Z0JBQ3RCLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUixDQUFrQixLQUFLLENBQUMsV0FBTixDQUFrQixDQUFsQixDQUFsQjs7QUFESjtBQUVBO0FBQUEsYUFBQSx3Q0FBQTs7a0JBQTBCLEtBQUssQ0FBQyxLQUFOLElBQWUsS0FBQSxZQUFpQjs7O0FBQ3REO0FBQUEsaUJBQUEsd0NBQUE7O29CQUFzQixDQUFBLENBQUEsQ0FBQSxZQUFpQixTQUFqQixDQUFBLElBQStCLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ3hELENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBUixDQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBbkIsRUFBMEIsS0FBMUIsRUFBaUMsSUFBakM7O0FBREo7WUFFQSxNQUFBLEdBQVMsSUFBSSxNQUFKLENBQVcsSUFBSSxLQUFKLENBQVUsSUFBSSxHQUFKOztBQUFRO0FBQUE7cUJBQUEsd0NBQUE7O2lDQUFBLENBQUMsQ0FBQyxXQUFGLENBQWMsQ0FBZDtBQUFBOzt5QkFBUixDQUFWLENBQVgsRUFDK0IsSUFBSSxLQUFKLENBQVUsSUFBSSxpQkFBSixDQUFzQixXQUF0QixDQUFWLENBRC9CO0FBRVQ7QUFMSjtBQU1BO0FBQUEsYUFBQSx3Q0FBQTs7WUFDSSxJQUFHLEtBQUssQ0FBQyxTQUFOLENBQUEsQ0FBSDtnQkFDSSxHQUFBLEdBQU0sR0FBQSxHQUFNLEtBQUssQ0FBQyxXQUFOLENBQWtCLENBQWxCO2dCQUNaLElBQXNDLEtBQUssQ0FBQyxLQUE1QztvQkFBQSxHQUFBLEdBQU0sSUFBSSxFQUFKLENBQU8sR0FBUCxFQUFZLEdBQVosRUFBaUIsS0FBSyxDQUFDLEtBQXZCLEVBQU47O2dCQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSSxNQUFKLENBQVcsSUFBSSxLQUFKLENBQVUsS0FBSyxDQUFDLElBQWhCLENBQVgsRUFBa0MsR0FBbEMsRUFBdUMsR0FBdkMsRUFBNEM7b0JBQUEsS0FBQSxFQUFPLElBQVA7aUJBQTVDLENBQVgsRUFISjthQUFBLE1BQUE7Z0JBS0ksR0FBQSxHQUFNO2dCQUNOLElBQUcsS0FBSyxDQUFDLEtBQVQ7b0JBQ0ksR0FBQSxHQUFNLElBQUksT0FBSixDQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBVCxHQUFpQixVQUE3QjtvQkFDTixHQUFBLEdBQU0sSUFBSSxNQUFKLENBQVcsSUFBSSxLQUFKLENBQVUsS0FBSyxDQUFDLElBQWhCLENBQVgsRUFBa0MsS0FBSyxDQUFDLEtBQXhDLEVBQStDLEdBQS9DO29CQUNOLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSSxFQUFKLENBQU8sR0FBUCxFQUFZLEdBQVosQ0FBWCxFQUhKO2lCQU5KOztZQVVBLElBQUEsQ0FBdUIsTUFBdkI7Z0JBQUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFaLEVBQUE7O0FBWEo7UUFZQSxRQUFBLEdBQVcsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQUE7UUFDWCxJQUF3QixNQUF4QjtZQUFBLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxFQUFBOztRQUNBLElBQXNDLEtBQUssQ0FBQyxNQUE1QztZQUFBLFFBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWlCLENBQUMsT0FBbEIsYUFBMEIsS0FBMUIsRUFBQTs7QUFDQSxhQUFBLGtEQUFBOztZQUNJLE1BQU8sQ0FBQSxDQUFBLENBQVAsR0FBWSxDQUFDLENBQUMsa0JBQUYsQ0FBcUIsQ0FBckI7WUFDWixDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVIsQ0FBa0IsZUFBQSxDQUFnQixNQUFPLENBQUEsQ0FBQSxDQUF2QixDQUFsQjtBQUZKO1FBR0EsS0FBQSxHQUFRO1FBRVIsSUFBQyxDQUFBLGFBQUQsQ0FBZSxTQUFDLElBQUQsRUFBTyxJQUFQO1lBQ1gsSUFBa0QsYUFBUSxLQUFSLEVBQUEsSUFBQSxNQUFsRDtnQkFBQSxJQUFJLENBQUMsS0FBTCxDQUFXLDRCQUFBLEdBQTZCLElBQXhDLEVBQUE7O21CQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWDtRQUZXLENBQWY7UUFJQSxJQUFBLENBQUEsQ0FBMEIsUUFBQSxJQUFZLElBQUMsQ0FBQSxRQUF2QyxDQUFBO1lBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLENBQUEsRUFBQTs7UUFDQSxJQUFBLEdBQU87UUFDUCxJQUFlLElBQUMsQ0FBQSxXQUFoQjtZQUFBLElBQUEsSUFBUSxJQUFSOztRQUNBLElBQXVCLElBQUMsQ0FBQSxJQUF4QjtZQUFBLElBQUEsSUFBUSxHQUFBLEdBQU0sSUFBQyxDQUFBLEtBQWY7O1FBQ0EsSUFBQSxJQUFRO1FBRVIsTUFBQSxHQUFTLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQUQ7QUFFVCxhQUFBLGtEQUFBOztZQUNJLElBQUcsQ0FBSDtnQkFBVSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFaLEVBQVY7O1lBQ0EsTUFBTSxDQUFDLElBQVAsZUFBWSxDQUFaO0FBRko7UUFHQSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBVixDQUFaO1FBQ0EsSUFBQSxDQUF5RyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBQSxDQUF6RztZQUFBLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFkLEVBQStCLElBQUMsQ0FBQSxJQUFJLENBQUMsdUJBQU4sQ0FBOEIsQ0FBOUIsQ0FBL0IsRUFBaUUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFBLEdBQUssSUFBQyxDQUFBLEdBQWhCLENBQWpFLEVBQVQ7O1FBQ0EsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBWjtRQUVBLElBQXVDLElBQUMsQ0FBQSxJQUF4QztBQUFBLG1CQUFRLENBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsR0FBWCxDQUFpQixTQUFBLFdBQUEsTUFBQSxDQUFBLEVBQXpCOztRQUNBLElBQUcsSUFBQyxDQUFBLEtBQUQsSUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFGLElBQVcsWUFBWixDQUFiO21CQUE0QyxJQUFDLENBQUEsWUFBRCxDQUFjLE1BQWQsRUFBNUM7U0FBQSxNQUFBO21CQUFzRSxPQUF0RTs7SUFuRVM7O21CQXFFYixhQUFBLEdBQWUsU0FBQyxRQUFEO0FBQ1gsWUFBQTtBQUFBO0FBQUE7YUFBQSx3Q0FBQTs7eUJBQUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxRQUFmO0FBQUE7O0lBRFc7O21CQU1mLGdCQUFBLEdBQWtCLFNBQUMsVUFBRCxFQUFhLElBQWI7UUFFZCxJQUEyQixVQUEzQjttQkFBQSwyQ0FBTSxVQUFOLEVBQWtCLElBQWxCLEVBQUE7O0lBRmM7Ozs7R0FqR1k7O0FBK0dsQyxPQUFPLENBQUMsS0FBUixHQUFzQjs7O0lBRUwsZUFBQyxLQUFELEVBQVEsTUFBUixFQUFnQixLQUFoQjtBQUNULFlBQUE7UUFEVSxJQUFDLENBQUEsT0FBRDtRQUFPLElBQUMsQ0FBQSxRQUFEO1FBQVEsSUFBQyxDQUFBLFFBQUQ7UUFDekIsT0FBQSxHQUFVLGNBQUEsQ0FBZSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBQSxDQUFpQixDQUFDLEtBQWpDO1FBQ1YsSUFBdUIsT0FBdkI7WUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sQ0FBWSxPQUFaLEVBQUE7O0lBRlM7O29CQVFiLFFBQUEsR0FBVSxDQUFDLE1BQUQsRUFBUyxPQUFUOztvQkFFVixrQkFBQSxHQUFvQixTQUFDLENBQUQ7ZUFFaEIsSUFBQyxDQUFBLElBQUksQ0FBQyxrQkFBTixDQUF5QixDQUF6QixFQUE0QixVQUE1QjtJQUZnQjs7b0JBSXBCLFdBQUEsR0FBYSxTQUFDLENBQUQ7QUFFVCxZQUFBO1FBQUEsSUFBcUIsSUFBQyxDQUFBLFNBQXRCO0FBQUEsbUJBQU8sSUFBQyxDQUFBLFVBQVI7O1FBQ0EsSUFBQSxHQUFPLElBQUMsQ0FBQTtRQUNSLElBQUcsSUFBSSxFQUFDLElBQUQsRUFBUDtZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsVUFBVyxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQUksQ0FBQztZQUMvQixJQUFxQixhQUFRLFlBQVIsRUFBQSxJQUFBLE1BQXJCO2dCQUFBLElBQUEsR0FBTyxHQUFBLEdBQUksS0FBWDs7WUFDQSxJQUFBLEdBQU8sSUFBSSxpQkFBSixDQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsSUFBckIsQ0FBdEIsRUFIWDtTQUFBLE1BSUssSUFBRyxJQUFJLENBQUMsU0FBTCxDQUFBLENBQUg7WUFDRCxJQUFBLEdBQU8sSUFBSSxpQkFBSixDQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsS0FBckIsQ0FBdEIsRUFETjs7UUFFTCxJQUFBLEdBQU8sSUFBSSxLQUFKLENBQVUsSUFBVjtRQUNQLElBQXlCLElBQUMsQ0FBQSxLQUExQjtZQUFBLElBQUEsR0FBTyxJQUFJLEtBQUosQ0FBVSxJQUFWLEVBQVA7O1FBQ0EsSUFBSSxDQUFDLDJCQUFMLENBQWlDLElBQUMsQ0FBQSxZQUFsQztlQUNBLElBQUMsQ0FBQSxTQUFELEdBQWE7SUFiSjs7b0JBZWIsU0FBQSxHQUFXLFNBQUE7ZUFFUCxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBQTtJQUZPOztvQkFVWCxRQUFBLEdBQVUsU0FBQyxRQUFELEVBQVcsSUFBWDtBQUVOLFlBQUE7O1lBRmlCLE9BQU8sSUFBQyxDQUFBOztRQUV6QixPQUFBLEdBQVUsU0FBQyxHQUFEO21CQUVOLFFBQUEsQ0FBUyxHQUFBLEdBQUksR0FBRyxDQUFDLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFJLENBQUMsS0FBcEMsRUFBNkMsR0FBN0M7UUFGTTtRQUlWLElBQUcsSUFBQSxZQUFnQixpQkFBbkI7WUFDSSxJQUFVLElBQUEsWUFBZ0IsV0FBMUI7QUFBQSx1QkFBQTs7QUFFQSxtQkFBTyxRQUFBLENBQVMsSUFBSSxDQUFDLEtBQWQsRUFBcUIsSUFBckIsRUFIWDs7UUFLQSxJQUF1QixJQUFBLFlBQWdCLEtBQXZDO0FBQUEsbUJBQU8sT0FBQSxDQUFRLElBQVIsRUFBUDs7QUFFQTtBQUFBLGFBQUEsd0NBQUE7O1lBRUksSUFBRyxHQUFBLFlBQWUsTUFBZixJQUE4QixxQkFBakM7Z0JBQ0ksR0FBQSxHQUFNLEdBQUcsQ0FBQyxTQURkOztZQUdBLElBQUcsR0FBQSxZQUFlLE1BQWxCO2dCQUVJLElBQUcsR0FBRyxDQUFDLEtBQUosWUFBcUIsTUFBeEI7b0JBQ0ksR0FBQSxHQUFNLEdBQUcsQ0FBQyxNQURkOztnQkFFQSxJQUFDLENBQUEsUUFBRCxDQUFVLFFBQVYsRUFBb0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFWLENBQUEsQ0FBcEIsRUFKSjthQUFBLE1BTUssSUFBRyxHQUFBLFlBQWUsS0FBbEI7Z0JBQ0QsSUFBQSxHQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBVCxDQUFBO2dCQUVQLFFBQUEsQ0FBUyxJQUFJLENBQUMsS0FBZCxFQUFxQixJQUFyQixFQUhDO2FBQUEsTUFLQSxJQUFHLEdBQUEsWUFBZSxLQUFsQjtnQkFFRCxJQUFHLEdBQUcsQ0FBQyxPQUFKLENBQUEsQ0FBQSxJQUFpQixHQUFHLENBQUMsUUFBSixDQUFBLENBQXBCO29CQUNJLElBQUMsQ0FBQSxRQUFELENBQVUsUUFBVixFQUFvQixHQUFHLENBQUMsSUFBeEIsRUFESjtpQkFBQSxNQUdLLElBQUcsR0FBRyxFQUFDLElBQUQsRUFBTjtvQkFDRCxPQUFBLENBQVEsR0FBUixFQURDO2lCQUFBLE1BQUE7b0JBS0QsUUFBQSxDQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBbEIsRUFBeUIsR0FBRyxDQUFDLElBQTdCLEVBTEM7aUJBTEo7YUFBQSxNQVdBLElBQUcsQ0FBQSxDQUFBLEdBQUEsWUFBbUIsU0FBbkIsQ0FBSDtnQkFDRCxHQUFHLENBQUMsS0FBSixDQUFVLG9CQUFBLEdBQW9CLENBQUMsR0FBRyxDQUFDLE9BQUosQ0FBQSxDQUFELENBQTlCLEVBREM7O0FBM0JUO0lBYk07Ozs7R0F6Q3NCOztBQThGcEMsT0FBTyxDQUFDLEtBQVIsR0FBc0I7OztvQkFFbEIsUUFBQSxHQUFVLENBQUMsTUFBRDs7b0JBRVYsWUFBQSxHQUFjOztJQUVELGVBQUMsSUFBRDtRQUNULElBQUMsQ0FBQSxJQUFELEdBQVcsSUFBSSxDQUFDLE9BQVIsR0FBcUIsSUFBckIsR0FBK0IsSUFBSSxPQUFKLENBQVksSUFBWjtJQUQ5Qjs7b0JBR2IsT0FBQSxHQUFTLFNBQUMsSUFBRDtlQUNMLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFjLElBQWQ7SUFESzs7b0JBR1QsV0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUNULElBQUMsQ0FBQSxJQUFJLENBQUMsa0JBQU4sQ0FBeUIsQ0FBekI7SUFEUzs7b0JBR2IsTUFBQSxHQUFRLFNBQUE7ZUFBRyxJQUFDLENBQUE7SUFBSjs7SUFJUixLQUFDLENBQUEsb0JBQUQsR0FBdUIsU0FBQyxDQUFELEVBQUksSUFBSixFQUFVLEtBQVY7QUFFbkIsWUFBQTtRQUFBLEtBQUEsR0FBUSxDQUFDO0FBQ0EsZUFBTSxDQUFDLElBQUEsR0FBTyxJQUFLLENBQUEsRUFBRSxLQUFGLENBQWIsQ0FBQSxJQUEyQixDQUFBLENBQUEsSUFBQSxZQUFvQixLQUFwQixDQUFqQztBQUFUO1FBQVM7UUFDVCxJQUFhLEtBQUEsSUFBUyxJQUFJLENBQUMsTUFBM0I7QUFBQSxtQkFBTyxHQUFQOztRQUNBLElBQUcsSUFBSSxDQUFDLE1BQUwsS0FBZSxDQUFsQjtZQUNJLElBQUEsR0FBTyxJQUFLLENBQUEsQ0FBQTtZQUNaLFNBQUEsR0FBWSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsQ0FBeEIsRUFBMkIsVUFBM0I7WUFDWixJQUFvQixLQUFwQjtBQUFBLHVCQUFPLFVBQVA7O0FBQ0EsbUJBQU8sRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFJLENBQUMsUUFBTCxDQUFnQixDQUFFLE9BQUEsQ0FBUSxPQUFSLEVBQWlCLENBQWpCLENBQUYsQ0FBQSxHQUFzQixRQUF0QyxDQUFWLEVBQTBELFNBQTFELEVBQXFFLElBQUksQ0FBQyxRQUFMLENBQWMsR0FBZCxDQUFyRSxFQUpYOztRQUtBLElBQUEsR0FBTyxJQUFLO0FBQ1osYUFBQSxnREFBQTs7WUFDSSxZQUFBLEdBQWUsSUFBSSxDQUFDLGtCQUFMLENBQXdCLENBQXhCLEVBQTJCLFVBQTNCO1lBQ2YsSUFBSyxDQUFBLENBQUEsQ0FBTCxHQUFhLElBQUEsWUFBZ0IsS0FBbkIsR0FDTCxFQUFFLENBQUMsTUFBSCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWdCLENBQUUsT0FBQSxDQUFRLE9BQVIsRUFBaUIsQ0FBakIsQ0FBRixDQUFBLEdBQXNCLFFBQXRDLENBQVYsRUFBMEQsWUFBMUQsRUFBd0UsSUFBSSxDQUFDLFFBQUwsQ0FBYyxHQUFkLENBQXhFLENBREssR0FFTCxFQUFFLENBQUMsTUFBSCxDQUFVLElBQUksQ0FBQyxRQUFMLENBQWMsR0FBZCxDQUFWLEVBQThCLFlBQTlCLEVBQTRDLElBQUksQ0FBQyxRQUFMLENBQWMsR0FBZCxDQUE1QztBQUpUO1FBS0EsSUFBRyxLQUFBLEtBQVMsQ0FBWjtZQUNJLElBQUEsR0FBTyxJQUFLLENBQUEsQ0FBQTtZQUNaLFVBQUEsR0FBYyxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsSUFBSyxTQUE3QixFQUFtQyxJQUFuQztBQUNkLG1CQUFPLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUFSLENBQWUsSUFBSSxDQUFDLFFBQUwsQ0FBYyxVQUFkLENBQWYsRUFBMEMsVUFBMUMsRUFBc0QsSUFBSSxDQUFDLFFBQUwsQ0FBYyxHQUFkLENBQXRELEVBSFg7O1FBSUEsSUFBQTs7QUFBUTtBQUFBO2lCQUFBLHdDQUFBOzs2QkFBQSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsQ0FBeEIsRUFBMkIsVUFBM0I7QUFBQTs7O1FBQ1IsSUFBQSxHQUFPLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxrQkFBUixDQUEyQixJQUEzQixFQUFpQyxJQUFqQztRQUNQLFVBQUEsR0FBYSxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsa0JBQVosQ0FBK0IsSUFBL0IsRUFBcUMsSUFBckM7UUFDUDtlQUNOLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLFFBQVIsQ0FBaUIsR0FBakIsQ0FBVixFQUFpQyxJQUFqQyxFQUF1QyxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsUUFBWixDQUFxQixXQUFyQixDQUF2QyxFQUEwRSxVQUExRSxFQUFzRixJQUFJLENBQUMsUUFBTCxDQUFjLEdBQWQsQ0FBdEY7SUF4Qm1COzs7O0dBbkJTOztBQXFEcEMsT0FBTyxDQUFDLFNBQVIsR0FBMEI7Ozs7Ozs7d0JBRXRCLFNBQUEsR0FBVzs7d0JBRVgsV0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUNULElBQUMsQ0FBQSxLQUFELENBQU8sNEVBQVA7SUFEUzs7d0JBR2IsV0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUNUO0lBRFM7O3dCQUdiLFFBQUEsR0FBVSxTQUFDLFFBQUQsR0FBQTs7OztHQVY4Qjs7QUFzQjVDLE9BQU8sQ0FBQyxLQUFSLEdBQXNCOzs7SUFFTCxlQUFDLFNBQUQsRUFBWSxPQUFaO1FBQ1QsSUFBQyxDQUFBLFNBQUQsc0JBQWdCLE9BQU8sQ0FBRSxnQkFBWixHQUF3QixTQUFTLENBQUMsTUFBVixDQUFBLENBQXhCLEdBQWdEO1FBQzdELElBQUMsQ0FBQSxLQUFELHFCQUFlLE9BQU8sQ0FBRTtJQUZmOztvQkFJYixRQUFBLEdBQVUsQ0FBQyxXQUFELEVBQWMsT0FBZCxFQUF1QixNQUF2Qjs7b0JBRVYsV0FBQSxHQUFhOztvQkFFYixVQUFBLEdBQVksU0FBQyxHQUFEO1FBQ1IsSUFBRyxHQUFIO21CQUNJLHVDQUFBLFNBQUEsRUFESjtTQUFBLE1BQUE7WUFHSSxJQUFDLENBQUEsT0FBRCxHQUFXLENBQUksSUFBQyxDQUFBLEtBQUQsQ0FBTztnQkFBQSxJQUFBLEVBQU0sSUFBTjthQUFQO21CQUNmLEtBSko7O0lBRFE7O29CQU9aLE9BQUEsR0FBUyxTQUFDLEtBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDtlQUNOO0lBREs7O29CQUdULEtBQUEsR0FBTyxTQUFBO0FBQ0gsWUFBQTtRQUFDLGNBQWUsSUFBQyxDQUFBO1FBQ2pCLElBQUEsQ0FBaUIsV0FBVyxDQUFDLE1BQTdCO0FBQUEsbUJBQU8sTUFBUDs7QUFDQSxhQUFBLCtDQUFBOztZQUNJLElBQW1CLFFBQUEsR0FBVyxJQUFJLENBQUMsS0FBTCxDQUFXO2dCQUFBLElBQUEsRUFBTSxJQUFOO2FBQVgsQ0FBOUI7QUFBQSx1QkFBTyxTQUFQOztBQURKO2VBRUE7SUFMRzs7b0JBV1AsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7UUFBQSxDQUFDLENBQUMsTUFBRixJQUFZO1FBQ1osR0FBQSxHQUFlO1FBQ2QsT0FBVTtRQUNYLElBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBQSxDQUFIO1lBQ0ksSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsRUFBVixFQURYO1NBQUEsTUFBQTtZQUdJLElBQUcsSUFBQyxDQUFBLE9BQUo7Z0JBQ0ksSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsSUFBQSxHQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBUixDQUFxQixTQUFyQixDQUF2QjtnQkFDQSxHQUFBLEdBQU8sRUFBQSxHQUFHLElBQUMsQ0FBQSxHQUFKLEdBQVUsSUFBVixHQUFlLFdBRjFCOztZQUdBLElBQUcsSUFBQyxDQUFBLEtBQUo7Z0JBQ0ksSUFBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQWpCLEdBQTBCLENBQTdCO29CQUNJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBakIsQ0FBeUIsSUFBSSxFQUFKLENBQU8sQ0FBQyxJQUFJLE1BQUosQ0FBVyxJQUFDLENBQUEsS0FBWixDQUFELENBQW1CLENBQUMsTUFBcEIsQ0FBQSxDQUFQLEVBQXFDLElBQUksZ0JBQUosQ0FBcUIsVUFBckIsQ0FBckMsQ0FBekIsRUFESjtpQkFBQSxNQUFBO29CQUdJLElBQTJDLElBQUMsQ0FBQSxLQUE1Qzt3QkFBQSxJQUFBLEdBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLElBQUksRUFBSixDQUFPLElBQUMsQ0FBQSxLQUFSLEVBQWUsSUFBZixDQUFELENBQVgsRUFBUDtxQkFISjtpQkFESjs7WUFLQSxJQUFBLEdBQU8sRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBVixFQUE0QixJQUFJLENBQUMsa0JBQUwsQ0FBd0IsQ0FBeEIsRUFBMkIsU0FBM0IsQ0FBNUIsRUFBbUUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFBLEdBQUssSUFBQyxDQUFBLEdBQWhCLENBQW5FLEVBWFg7O1FBWUEsTUFBQSxHQUFTLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFBLEdBQU0sSUFBQyxDQUFBLEdBQVAsR0FBYSxTQUF2QixDQUFWLEVBQTZDLElBQUMsQ0FBQSxTQUFTLENBQUMsa0JBQVgsQ0FBOEIsQ0FBOUIsRUFBaUMsV0FBakMsQ0FBN0MsRUFDTCxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsQ0FESyxFQUNhLElBRGIsRUFDbUIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWLENBRG5CO1FBRVQsSUFBRyxJQUFDLENBQUEsT0FBSjtZQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFBLEdBQUssSUFBQyxDQUFBLEdBQU4sR0FBVSxTQUFWLEdBQW1CLElBQW5CLEdBQXdCLEdBQWxDLENBQVosRUFESjs7ZUFFQTtJQXBCUzs7OztHQS9CbUI7O0FBNkRwQyxPQUFPLENBQUMsRUFBUixHQUFtQjtBQUNmLFFBQUE7Ozs7SUFBYSxZQUFDLEVBQUQsRUFBSyxLQUFMLEVBQVksTUFBWixFQUFvQixJQUFwQjtRQUNULElBQStCLEVBQUEsS0FBTSxJQUFyQztBQUFBLG1CQUFPLElBQUksRUFBSixDQUFPLEtBQVAsRUFBYyxNQUFkLEVBQVA7O1FBQ0EsSUFBRyxFQUFBLEtBQU0sSUFBVDtBQUNJLG1CQUFPLElBQUMsQ0FBQSxVQUFELENBQVksS0FBWixFQURYOztRQUVBLElBQUcsRUFBQSxLQUFNLEtBQVQ7WUFDSSxJQUE4QixLQUFBLFlBQWlCLElBQWpCLElBQTBCLENBQUksS0FBSyxFQUFDLEVBQUQsRUFBbkMsSUFBMkMsQ0FBSSxLQUFLLENBQUMsS0FBbkY7QUFBQSx1QkFBTyxLQUFLLENBQUMsV0FBTixDQUFBLEVBQVA7O1lBQ0EsSUFBZ0MsS0FBQSxZQUFpQixJQUFqQixJQUEwQixLQUFLLENBQUMsS0FBaEMsSUFBeUMsS0FBSyxFQUFDLEVBQUQsRUFBOUU7Z0JBQUEsS0FBQSxHQUFRLElBQUksTUFBSixDQUFXLEtBQVgsRUFBUjthQUZKOztRQUdBLElBQUMsQ0FBQSxRQUFELEdBQVksV0FBWSxDQUFBLEVBQUEsQ0FBWixJQUFtQjtRQUMvQixJQUFDLENBQUEsS0FBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE1BQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxJQUFELEdBQVksQ0FBQyxDQUFDO0FBQ2QsZUFBTztJQVhFOztJQWFiLFdBQUEsR0FDSTtRQUFBLElBQUEsRUFBYSxLQUFiO1FBQ0EsSUFBQSxFQUFhLEtBRGI7UUFFQSxJQUFBLEVBQWEsSUFGYjtRQUdBLFdBQUEsRUFBYSxRQUhiOzs7SUFLSixVQUFBLEdBQ0k7UUFBQSxLQUFBLEVBQU8sS0FBUDtRQUNBLEtBQUEsRUFBTyxLQURQOzs7aUJBR0osUUFBQSxHQUFVLENBQUMsT0FBRCxFQUFVLFFBQVY7O2lCQUVWLFFBQUEsR0FBVSxTQUFBO0FBQ04sWUFBQTtlQUFBLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxJQUFlLFNBQUEsSUFBQyxDQUFBLFNBQUQsS0FBYyxHQUFkLElBQUEsSUFBQSxLQUFtQixHQUFuQixDQUFmLElBQ0ksSUFBQyxDQUFBLEtBQUQsWUFBa0IsS0FEdEIsSUFDZ0MsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQUE7SUFGMUI7O2lCQUlWLE9BQUEsR0FBUyxTQUFBO0FBQ0wsWUFBQTt1QkFBQSxJQUFDLENBQUEsU0FBRCxLQUFjLE9BQWQsSUFBQSxJQUFBLEtBQXVCO0lBRGxCOztpQkFHVCxPQUFBLEdBQVMsU0FBQTtlQUNMLENBQUksSUFBQyxDQUFBO0lBREE7O2lCQUdULFNBQUEsR0FBVyxTQUFBO2VBQ1AsQ0FBSSxJQUFDLENBQUEsUUFBRCxDQUFBO0lBREc7O2lCQUtYLFdBQUEsR0FBYSxTQUFBO0FBQ1QsWUFBQTt1QkFBQSxJQUFDLENBQUEsU0FBRCxLQUFjLEdBQWQsSUFBQSxJQUFBLEtBQW1CLEdBQW5CLElBQUEsSUFBQSxLQUF3QixJQUF4QixJQUFBLElBQUEsS0FBOEIsSUFBOUIsSUFBQSxJQUFBLEtBQW9DLEtBQXBDLElBQUEsSUFBQSxLQUEyQztJQURsQzs7aUJBR2IsTUFBQSxHQUFRLFNBQUE7QUFDSixZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsV0FBRCxDQUFBLENBQUEsSUFBbUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQUEsQ0FBdEI7WUFDSSxhQUFBLEdBQWdCO1lBQ2hCLElBQUEsR0FBTztBQUNQLG1CQUFNLElBQUEsSUFBUyxJQUFJLENBQUMsUUFBcEI7Z0JBQ0ksa0JBQUEsZ0JBQW9CLElBQUksQ0FBQyxRQUFMLElBQWlCO2dCQUNyQyxJQUFBLEdBQU8sSUFBSSxDQUFDO1lBRmhCO1lBR0EsSUFBQSxDQUF3QyxhQUF4QztBQUFBLHVCQUFPLElBQUksTUFBSixDQUFXLElBQVgsQ0FBZ0IsQ0FBQyxNQUFqQixDQUFBLEVBQVA7O1lBQ0EsSUFBQSxHQUFPO0FBQ1AsbUJBQU0sSUFBQSxJQUFTLElBQUksQ0FBQyxRQUFwQjtnQkFDSSxJQUFJLENBQUMsTUFBTCxHQUFjLENBQUMsSUFBSSxDQUFDO2dCQUNwQixJQUFJLENBQUMsUUFBTCxHQUFnQixVQUFXLENBQUEsSUFBSSxDQUFDLFFBQUw7Z0JBQzNCLElBQUEsR0FBTyxJQUFJLENBQUM7WUFIaEI7bUJBSUEsS0FaSjtTQUFBLE1BYUssSUFBRyxFQUFBLEdBQUssVUFBVyxDQUFBLElBQUMsQ0FBQSxRQUFELENBQW5CO1lBQ0QsSUFBQyxDQUFBLFFBQUQsR0FBWTtZQUNaLElBQUcsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQUEsQ0FBQSxZQUEyQixFQUE5QjtnQkFDSSxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsQ0FBQSxFQURKOzttQkFFQSxLQUpDO1NBQUEsTUFLQSxJQUFHLElBQUMsQ0FBQSxNQUFKO21CQUNELElBQUksTUFBSixDQUFXLElBQVgsQ0FBZ0IsQ0FBQyxNQUFqQixDQUFBLEVBREM7U0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLFFBQUQsS0FBYSxHQUFiLElBQXFCLENBQUMsR0FBQSxHQUFNLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFBLENBQVAsQ0FBQSxZQUFtQyxFQUF4RCxJQUNvRCxTQUFBLEdBQUcsQ0FBQyxTQUFKLEtBQWlCLEdBQWpCLElBQUEsSUFBQSxLQUFzQixJQUF0QixJQUFBLElBQUEsS0FBNEIsWUFBNUIsQ0FEdkQ7bUJBRUQsSUFGQztTQUFBLE1BQUE7bUJBSUQsSUFBSSxFQUFKLENBQU8sR0FBUCxFQUFZLElBQVosRUFKQzs7SUFyQkQ7O2lCQTJCUixVQUFBLEdBQVksU0FBQyxDQUFEO0FBQ1IsWUFBQTtlQUFBLFNBQUEsSUFBQyxDQUFBLFNBQUQsS0FBYyxJQUFkLElBQUEsSUFBQSxLQUFvQixJQUFwQixJQUFBLElBQUEsS0FBMEIsUUFBMUIsQ0FBQSxJQUF3QyxVQUFBLENBQVcsQ0FBWCxFQUFjLElBQWQsRUFBb0IsT0FBcEI7SUFEaEM7O2lCQUdaLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDUixZQUFBO1FBQUEsWUFBQSxHQUFlO1FBQ2YsSUFBQSxHQUFVLEdBQUEsWUFBZSxNQUFmLElBQTBCLENBQUMsR0FBQSxHQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBVixDQUFBLENBQVAsQ0FBQSxZQUFzQyxJQUFuRSxHQUNILEdBREcsR0FHSDtBQUNKO0FBQUEsYUFBQSx3Q0FBQTs7WUFDSSxJQUFHLEtBQUssQ0FBQyxLQUFUO2dCQUNJLFlBQVksQ0FBQyxJQUFiLENBQWtCLEtBQUssQ0FBQyxLQUF4QjtnQkFDQSxPQUFPLEtBQUssQ0FBQyxNQUZqQjthQUFBLE1BQUE7Z0JBSUksWUFBWSxDQUFDLElBQWIsQ0FBa0IsS0FBbEIsRUFKSjs7QUFESjtRQU1BLElBQUEsR0FBTyxJQUFJLElBQUosQ0FBUyxHQUFULEVBQWMsWUFBZDtRQUNQLElBQUksRUFBQyxFQUFELEVBQUosR0FBVTtlQUNWO0lBZFE7O2lCQWdCWixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsV0FBRCxDQUFBLENBQUEsSUFBbUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxXQUFQLENBQUE7UUFHN0IsSUFBQSxDQUE2QixPQUE3QjtZQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxHQUFlLElBQUMsQ0FBQSxNQUFoQjs7UUFDQSxJQUFHLElBQUMsQ0FBQSxRQUFELEtBQWEsUUFBYixJQUEwQixDQUFDLENBQUMsS0FBSyxDQUFDLEtBQVIsQ0FBYyxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsQ0FBQSxDQUFrQixDQUFDLEtBQWpDLENBQTdCO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywyQ0FBUCxFQURKOztRQUVBLFlBQUcsSUFBQyxDQUFBLFNBQUQsS0FBYyxJQUFkLElBQUEsSUFBQSxLQUFvQixJQUF2QjtZQUNJLE9BQUEsR0FBVSxjQUFBLENBQWUsSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLENBQUEsQ0FBa0IsQ0FBQyxLQUFsQztZQUNWLElBQXdCLE9BQXhCO2dCQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxDQUFhLE9BQWIsRUFBQTthQUZKOztRQUdBLElBQTBCLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBMUI7QUFBQSxtQkFBTyxJQUFDLENBQUEsWUFBRCxDQUFjLENBQWQsRUFBUDs7UUFDQSxJQUEwQixJQUFDLENBQUEsT0FBRCxDQUFBLENBQTFCO0FBQUEsbUJBQU8sSUFBQyxDQUFBLFlBQUQsQ0FBYyxDQUFkLEVBQVA7O1FBQ0EsSUFBMEIsT0FBMUI7QUFBQSxtQkFBTyxJQUFDLENBQUEsWUFBRCxDQUFjLENBQWQsRUFBUDs7QUFDQSxnQkFBTyxJQUFDLENBQUEsUUFBUjtBQUFBLGlCQUNTLEdBRFQ7dUJBQ3FCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixDQUFsQjtBQURyQixpQkFFUyxJQUZUO3VCQUVtQixJQUFDLENBQUEsWUFBRCxDQUFjLENBQWQ7QUFGbkIsaUJBR1MsSUFIVDt1QkFHbUIsSUFBQyxDQUFBLG9CQUFELENBQXNCLENBQXRCO0FBSG5CLGlCQUlTLElBSlQ7dUJBSW1CLElBQUMsQ0FBQSxhQUFELENBQWUsQ0FBZjtBQUpuQjtnQkFNUSxHQUFBLEdBQU0sSUFBQyxDQUFBLEtBQUssQ0FBQyxrQkFBUCxDQUEwQixDQUExQixFQUE2QixRQUE3QjtnQkFDTixHQUFBLEdBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUEyQixDQUEzQixFQUE4QixRQUE5QjtnQkFDTixNQUFBLEdBQVMsRUFBRSxDQUFDLE1BQUgsQ0FBVSxHQUFWLEVBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFBLEdBQUksSUFBQyxDQUFBLFFBQUwsR0FBYyxHQUF4QixDQUFmLEVBQTRDLEdBQTVDO2dCQUNULElBQUcsQ0FBQyxDQUFDLEtBQUYsSUFBVyxRQUFkOzJCQUE0QixPQUE1QjtpQkFBQSxNQUFBOzJCQUF3QyxJQUFDLENBQUEsWUFBRCxDQUFjLE1BQWQsRUFBeEM7O0FBVFI7SUFiUzs7aUJBOEJiLFlBQUEsR0FBYyxTQUFDLENBQUQ7QUFDVixZQUFBO1FBQUEsT0FBMEIsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBZCxDQUFvQixDQUFwQixDQUExQixFQUFDLElBQUMsQ0FBQSxLQUFLLENBQUMsZ0JBQVIsRUFBZ0I7UUFDaEIsR0FBQSxHQUFNLElBQUMsQ0FBQSxLQUFLLENBQUMsa0JBQVAsQ0FBMEIsQ0FBMUIsRUFBNkIsUUFBN0I7UUFDTixTQUFBLEdBQVksR0FBRyxDQUFDLE1BQUosQ0FBVyxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQUEsR0FBRyxDQUFJLElBQUMsQ0FBQSxNQUFKLEdBQWdCLElBQWhCLEdBQTBCLElBQTNCLENBQUgsR0FBbUMsR0FBN0MsQ0FBWCxFQUNQLE1BQU0sQ0FBQyxrQkFBUCxDQUEwQixDQUExQixDQURPLEVBQ3VCLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBQSxHQUFJLElBQUMsQ0FBQSxRQUFMLEdBQWMsR0FBeEIsQ0FEdkIsRUFDcUQsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUEyQixDQUEzQixFQUE4QixRQUE5QixDQURyRDtlQUVaLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZDtJQUxVOztpQkFRZCxnQkFBQSxHQUFrQixTQUFDLENBQUQ7QUFDZCxZQUFBO1FBQUEsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVAsQ0FBQSxDQUFIO1lBQ0ksR0FBQSxHQUFNLElBQUksaUJBQUosQ0FBc0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFSLENBQXFCLEtBQXJCLENBQXRCO1lBQ04sR0FBQSxHQUFNLElBQUksTUFBSixDQUFXLElBQUksTUFBSixDQUFXLEdBQVgsRUFBZ0IsSUFBQyxDQUFBLEtBQWpCLENBQVgsRUFGVjtTQUFBLE1BQUE7WUFJSSxHQUFBLEdBQU0sSUFBQyxDQUFBO1lBQ1AsR0FBQSxHQUFNLElBTFY7O2VBTUEsSUFBSSxFQUFKLENBQU8sSUFBSSxTQUFKLENBQWMsR0FBZCxDQUFQLEVBQTJCLEdBQTNCLEVBQWdDO1lBQUEsSUFBQSxFQUFNLElBQU47U0FBaEMsQ0FBMkMsQ0FBQyxPQUE1QyxDQUFvRCxJQUFDLENBQUEsTUFBckQsQ0FBNEQsQ0FBQyxrQkFBN0QsQ0FBZ0YsQ0FBaEY7SUFQYzs7aUJBVWxCLFlBQUEsR0FBYyxTQUFDLENBQUQ7QUFDVixZQUFBO1FBQUEsS0FBQSxHQUFRO1FBQ1IsRUFBQSxHQUFLLElBQUMsQ0FBQTtRQUNOLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBQyxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVYsQ0FBRCxDQUFYO1FBQ0EsSUFBRyxFQUFBLEtBQU0sR0FBTixJQUFjLElBQUMsQ0FBQSxLQUFELFlBQWtCLFNBQW5DO1lBQ0ksSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLEdBQWlCLENBQUksSUFBQyxDQUFBLEtBQUssQ0FBQztBQUM1QixtQkFBTyxJQUFDLENBQUEsS0FBSyxDQUFDLGtCQUFQLENBQTBCLENBQTFCLEVBRlg7O1FBR0EsSUFBRyxDQUFDLENBQUMsS0FBRixJQUFXLFlBQWQ7QUFDSSxtQkFBTyxDQUFDLElBQUksTUFBSixDQUFXLElBQVgsQ0FBRCxDQUFpQixDQUFDLGtCQUFsQixDQUFxQyxDQUFyQyxFQURYOztRQUVBLFNBQUEsR0FBWSxFQUFBLEtBQU8sR0FBUCxJQUFBLEVBQUEsS0FBWTtRQUN4QixJQUErQixDQUFBLEVBQUEsS0FBTyxLQUFQLElBQUEsRUFBQSxLQUFjLFFBQWQsSUFBQSxFQUFBLEtBQXdCLFFBQXhCLENBQUEsSUFDSyxTQUFBLElBQWMsSUFBQyxDQUFBLEtBQUQsWUFBa0IsRUFBaEMsSUFBdUMsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLEtBQW1CLEVBRDlGO1lBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFELENBQVgsRUFBQTs7UUFFQSxJQUFHLENBQUMsU0FBQSxJQUFjLElBQUMsQ0FBQSxLQUFELFlBQWtCLEVBQWpDLENBQUEsSUFBd0MsQ0FBQyxFQUFBLEtBQU0sS0FBTixJQUFnQixJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBbUIsQ0FBbkIsQ0FBakIsQ0FBM0M7WUFDSSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksTUFBSixDQUFXLElBQUMsQ0FBQSxLQUFaLEVBRGI7O1FBRUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsS0FBSyxDQUFDLGtCQUFQLENBQTBCLENBQTFCLEVBQTZCLFFBQTdCLENBQVg7UUFDQSxJQUFtQixJQUFDLENBQUEsSUFBcEI7WUFBQSxLQUFLLENBQUMsT0FBTixDQUFBLEVBQUE7O2VBQ0EsSUFBQyxDQUFBLGtCQUFELENBQW9CLEtBQXBCLEVBQTJCLEVBQTNCO0lBaEJVOztpQkFrQmQsWUFBQSxHQUFjLFNBQUMsQ0FBRDtBQUNWLFlBQUE7UUFBQSxLQUFBLEdBQVE7UUFDUixFQUFBLEdBQUssSUFBQyxDQUFBO1FBQ04sSUFBTyxzQkFBUDtZQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sdUNBQVAsRUFESjs7UUFFQSxJQUFHLGFBQWdCLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBQyxDQUFBLEtBQWIsQ0FBaEIsRUFBQSxZQUFBLE1BQUEsSUFBd0MsQ0FBSSxDQUFDLElBQUMsQ0FBQSxLQUFELFlBQWtCLEtBQW5CLENBQS9DO1lBQ0ksSUFBK0QsNkJBQS9EO2dCQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsa0JBQWxCLENBQXFDLENBQXJDLEVBQXdDLFFBQXhDLENBQVgsRUFBQTthQURKO1NBQUEsTUFBQTtZQUdJLElBQThCLENBQUMsQ0FBQyxLQUFGLElBQVcsV0FBekM7Z0JBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFELENBQVgsRUFBQTs7WUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxFQUFWLENBQUQsQ0FBWDtZQUNBLDRDQUF5QyxDQUFFLGVBQWIsS0FBc0IsRUFBcEQ7Z0JBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFELENBQVgsRUFBQTs7WUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxLQUFLLENBQUMsa0JBQVAsQ0FBMEIsQ0FBMUIsRUFBNkIsUUFBN0IsQ0FBWDtZQUNBLElBQThCLENBQUMsQ0FBQyxLQUFGLElBQVcsV0FBekM7Z0JBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFELENBQVgsRUFBQTthQVBKOztlQVFBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixLQUFwQixFQUEyQixFQUEzQjtJQWJVOztpQkFlZCxZQUFBLEdBQWMsU0FBQyxDQUFEO0FBRVYsWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFJLEtBQUosQ0FBVSxJQUFJLGlCQUFKLENBQXNCLE1BQXRCLENBQVYsRUFBeUMsQ0FBQyxJQUFJLE1BQUosQ0FBVyxJQUFJLFlBQUosQ0FBaUIsS0FBakIsQ0FBWCxDQUFELENBQXpDO2VBQ04sSUFBSSxJQUFKLENBQVMsR0FBVCxFQUFjLENBQUMsSUFBQyxDQUFBLEtBQUYsRUFBUyxJQUFDLENBQUEsTUFBVixDQUFkLENBQWdDLENBQUMsa0JBQWpDLENBQW9ELENBQXBEO0lBSFU7O2lCQUtkLG9CQUFBLEdBQXNCLFNBQUMsQ0FBRDtBQUNsQixZQUFBO1FBQUEsS0FBQSxHQUFRLElBQUksS0FBSixDQUFVLElBQUksaUJBQUosQ0FBc0IsTUFBdEIsQ0FBVixFQUF5QyxDQUFDLElBQUksTUFBSixDQUFXLElBQUksWUFBSixDQUFpQixPQUFqQixDQUFYLENBQUQsQ0FBekM7UUFDUixNQUFBLEdBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQUEsQ0FBSCxHQUE0QixJQUFJLE1BQUosQ0FBVyxJQUFDLENBQUEsTUFBWixDQUE1QixHQUFvRCxJQUFDLENBQUE7UUFDOUQsR0FBQSxHQUFNLElBQUksRUFBSixDQUFPLEdBQVAsRUFBWSxJQUFDLENBQUEsS0FBYixFQUFvQixNQUFwQjtlQUNOLElBQUksSUFBSixDQUFTLEtBQVQsRUFBZ0IsQ0FBQyxHQUFELENBQWhCLENBQXNCLENBQUMsa0JBQXZCLENBQTBDLENBQTFDO0lBSmtCOztpQkFNdEIsYUFBQSxHQUFlLFNBQUMsQ0FBRDtBQUNYLFlBQUE7UUFBQSxHQUFBLEdBQU0sSUFBSSxLQUFKLENBQVUsSUFBSSxPQUFKLENBQVksT0FBQSxDQUFRLFFBQVIsRUFBa0IsQ0FBbEIsQ0FBWixDQUFWO2VBQ04sSUFBSSxJQUFKLENBQVMsR0FBVCxFQUFjLENBQUMsSUFBQyxDQUFBLEtBQUYsRUFBUyxJQUFDLENBQUEsTUFBVixDQUFkLENBQWdDLENBQUMsa0JBQWpDLENBQW9ELENBQXBEO0lBRlc7O2lCQUlmLFFBQUEsR0FBVSxTQUFDLEdBQUQ7ZUFDTixpQ0FBTSxHQUFOLEVBQVcsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLEdBQW9CLEdBQXBCLEdBQTBCLElBQUMsQ0FBQSxRQUF0QztJQURNOzs7O0dBMUxnQjs7QUFtTTlCLE9BQU8sQ0FBQyxFQUFSLEdBQW1COzs7SUFFRixZQUFDLE1BQUQsRUFBVSxLQUFWO1FBQUMsSUFBQyxDQUFBLFNBQUQ7UUFBUyxJQUFDLENBQUEsUUFBRDtJQUFWOztpQkFFYixRQUFBLEdBQVUsQ0FBQyxRQUFELEVBQVcsT0FBWDs7aUJBRVYsTUFBQSxHQUFROztpQkFFUixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLEtBQUQsWUFBa0IsS0FBbEIsSUFBNEIsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQUEsQ0FBNUIsSUFBaUQsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQXhFO0FBQ0k7QUFBQSxpQkFBQSx3Q0FBQTs7c0JBQW9DLEdBQUEsWUFBZTs7O2dCQUMvQyxRQUFBLEdBQVc7QUFDWDtBQUZKO1lBSUEsSUFBQSxDQUErQixRQUEvQjtBQUFBLHVCQUFPLElBQUMsQ0FBQSxhQUFELENBQWUsQ0FBZixFQUFQO2FBTEo7O2VBTUEsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsQ0FBakI7SUFQUzs7aUJBU2IsYUFBQSxHQUFlLFNBQUMsQ0FBRDtBQUNYLFlBQUE7UUFBQSxPQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFjLENBQWQsRUFBaUIsUUFBakIsQ0FBYixFQUFDLGFBQUQsRUFBTTtRQUNOLE9BQWdCLElBQUMsQ0FBQSxPQUFKLEdBQWlCLENBQUMsT0FBRCxFQUFVLE1BQVYsQ0FBakIsR0FBd0MsQ0FBQyxPQUFELEVBQVUsTUFBVixDQUFyRCxFQUFDLGFBQUQsRUFBTTtRQUNOLEtBQUEsR0FBUTtBQUNSO0FBQUEsYUFBQSxnREFBQTs7WUFDSSxJQUFHLENBQUg7Z0JBQVUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBWCxFQUFWOztZQUNBLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixDQUFhLENBQUksQ0FBSCxHQUFVLEdBQVYsR0FBbUIsR0FBcEIsQ0FBYixFQUF1QyxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBdkMsRUFBdUQsSUFBSSxDQUFDLGtCQUFMLENBQXdCLENBQXhCLEVBQTJCLFlBQTNCLENBQXZEO0FBRlo7UUFHQSxJQUFHLENBQUMsQ0FBQyxLQUFGLEdBQVUsUUFBYjttQkFBMkIsTUFBM0I7U0FBQSxNQUFBO21CQUFzQyxJQUFDLENBQUEsWUFBRCxDQUFjLEtBQWQsRUFBdEM7O0lBUFc7O2lCQVNmLGVBQUEsR0FBaUIsU0FBQyxDQUFEO0FBQ2IsWUFBQTtRQUFBLE9BQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQWMsQ0FBZCxFQUFpQixVQUFqQixDQUFiLEVBQUMsYUFBRCxFQUFNO1FBQ04sU0FBQSxHQUFZLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxPQUFBLENBQVEsU0FBUixFQUFtQixDQUFuQixDQUFBLEdBQXdCLFFBQWxDLENBQVYsRUFBdUQsSUFBQyxDQUFBLEtBQUssQ0FBQyxrQkFBUCxDQUEwQixDQUExQixFQUE2QixVQUE3QixDQUF2RCxFQUNSLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQURRLEVBQ1MsR0FEVCxFQUNjLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQSxHQUFPLENBQUcsSUFBQyxDQUFBLE9BQUosR0FBaUIsS0FBakIsR0FBNEIsTUFBNUIsQ0FBakIsQ0FEZDtRQUVaLElBQW9CLGVBQUEsQ0FBZ0IsR0FBaEIsQ0FBQSxLQUF3QixlQUFBLENBQWdCLEdBQWhCLENBQTVDO0FBQUEsbUJBQU8sVUFBUDs7UUFDQSxTQUFBLEdBQVksR0FBRyxDQUFDLE1BQUosQ0FBVyxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBWCxFQUE0QixTQUE1QjtRQUNaLElBQUcsQ0FBQyxDQUFDLEtBQUYsR0FBVSxVQUFiO21CQUE2QixVQUE3QjtTQUFBLE1BQUE7bUJBQTRDLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZCxFQUE1Qzs7SUFOYTs7aUJBUWpCLFFBQUEsR0FBVSxTQUFDLEdBQUQ7ZUFDTixpQ0FBTSxHQUFOLEVBQVcsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLEdBQW9CLENBQUcsSUFBQyxDQUFBLE9BQUosR0FBaUIsR0FBakIsR0FBMEIsRUFBMUIsQ0FBL0I7SUFETTs7OztHQWxDZ0I7O0FBNkM5QixPQUFPLENBQUMsR0FBUixHQUFvQjs7O0lBRUgsYUFBQyxPQUFELEVBQVcsYUFBWCxFQUEyQixRQUEzQixFQUFzQyxNQUF0QztRQUFDLElBQUMsQ0FBQSxVQUFEO1FBQVUsSUFBQyxDQUFBLGdCQUFEO1FBQWdCLElBQUMsQ0FBQSxXQUFEO1FBQVcsSUFBQyxDQUFBLFNBQUQ7SUFBdEM7O2tCQUViLFFBQUEsR0FBVSxDQUFDLFNBQUQsRUFBWSxVQUFaLEVBQXdCLFFBQXhCOztrQkFFVixXQUFBLEdBQWE7O2tCQUViLEtBQUEsR0FBTyxTQUFDLENBQUQ7QUFBTyxZQUFBO2VBQUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULENBQWUsQ0FBZixDQUFBLDBDQUE4QixDQUFFLEtBQVgsQ0FBaUIsQ0FBakI7SUFBNUI7O2tCQUVQLFVBQUEsR0FBWSxTQUFDLEdBQUQ7UUFDUixJQUF3QyxJQUFDLENBQUEsT0FBekM7WUFBQSxJQUFDLENBQUEsT0FBRCxHQUFZLElBQUMsQ0FBQSxPQUFRLENBQUMsVUFBVixDQUFxQixHQUFyQixFQUFaOztRQUNBLElBQXdDLElBQUMsQ0FBQSxRQUF6QztZQUFBLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQXFCLEdBQXJCLEVBQVo7O2VBQ0E7SUFIUTs7a0JBT1osV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7UUFBQSxDQUFDLENBQUMsTUFBRixJQUFZO1FBQ1osT0FBQSxHQUFZLElBQUMsQ0FBQSxPQUFPLENBQUMsa0JBQVQsQ0FBNEIsQ0FBNUIsRUFBK0IsU0FBL0I7UUFFWixTQUFBLEdBQWUsSUFBQyxDQUFBLFFBQUosR0FDUixDQUFBLDBCQUFBLEdBQTZCLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBUixDQUFxQixPQUFyQixFQUE4QjtZQUFBLE9BQUEsRUFBUyxLQUFUO1NBQTlCLENBQTdCLEVBQ0EsV0FBQSxHQUFjLElBQUksaUJBQUosQ0FBc0IsMEJBQXRCLENBRGQsRUFFRyxJQUFDLENBQUEsYUFBSixHQUNJLENBQUEsT0FBQSxHQUFVLGNBQUEsQ0FBZSxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQWYsQ0FBQSxDQUEwQixDQUFDLEtBQTFDLENBQVYsRUFDZ0MsT0FBaEMsR0FBQSxJQUFDLENBQUEsYUFBYSxDQUFDLEtBQWYsQ0FBcUIsT0FBckIsQ0FBQSxHQUFBLE1BREEsRUFFQSxJQUFDLENBQUEsUUFBUSxDQUFDLE9BQVYsQ0FBa0IsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLGFBQVosRUFBMkIsV0FBM0IsQ0FBbEIsQ0FGQSxDQURKLEdBQUEsTUFGQSxFQU1BLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxVQUFWLENBQVYsRUFBaUMsV0FBVyxDQUFDLGtCQUFaLENBQStCLENBQS9CLENBQWpDLEVBQW9FLElBQUMsQ0FBQSxRQUFELENBQVUsT0FBVixDQUFwRSxFQUNJLElBQUMsQ0FBQSxRQUFRLENBQUMsa0JBQVYsQ0FBNkIsQ0FBN0IsRUFBZ0MsU0FBaEMsQ0FESixFQUNnRCxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUEsR0FBSyxJQUFDLENBQUEsR0FBTixHQUFVLEdBQXBCLENBRGhELENBTkEsQ0FEUSxHQVNQLENBQUEsQ0FBTyxJQUFDLENBQUEsTUFBRCxJQUFXLElBQUMsQ0FBQSxRQUFuQixDQUFBLEdBQ0QsQ0FBQSwwQkFBQSxHQUE2QixDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsT0FBckIsRUFBOEI7WUFBQSxPQUFBLEVBQVMsS0FBVDtTQUE5QixDQUE3QixFQUNBLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxVQUFBLEdBQVcsMEJBQVgsR0FBc0MsTUFBaEQsQ0FBRCxDQURBLENBREMsR0FJRDtRQUVKLFVBQUEsR0FBZ0IsSUFBQyxDQUFBLE1BQUosR0FBaUIsRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLGNBQVYsQ0FBVixFQUFxQyxJQUFDLENBQUEsTUFBTSxDQUFDLGtCQUFSLENBQTJCLENBQTNCLEVBQThCLFNBQTlCLENBQXJDLEVBQzFCLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQSxHQUFLLElBQUMsQ0FBQSxHQUFOLEdBQVUsR0FBcEIsQ0FEMEIsQ0FBakIsR0FDcUI7ZUFFbEMsRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFhLElBQUMsQ0FBQSxHQUFGLEdBQU0sU0FBbEIsQ0FBVixFQUNJLE9BREosRUFFSSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUEsR0FBSyxJQUFDLENBQUEsR0FBTixHQUFVLEdBQXBCLENBRkosRUFFNkIsU0FGN0IsRUFFd0MsVUFGeEM7SUF0QlM7Ozs7R0FqQmU7O0FBbURoQyxPQUFPLENBQUMsS0FBUixHQUFzQjs7O0lBRUwsZUFBQyxVQUFEO1FBQUMsSUFBQyxDQUFBLGFBQUQ7SUFBRDs7b0JBRWIsUUFBQSxHQUFVLENBQUMsWUFBRDs7b0JBRVYsV0FBQSxHQUFhOztvQkFDYixLQUFBLEdBQWE7O29CQUdiLFVBQUEsR0FBWTs7b0JBRVosV0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUNULEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsR0FBRCxHQUFPLFFBQWpCLENBQVYsRUFBc0MsSUFBQyxDQUFBLFVBQVUsQ0FBQyxrQkFBWixDQUErQixDQUEvQixDQUF0QyxFQUF5RSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsQ0FBekU7SUFEUzs7OztHQVptQjs7QUF5QnBDLE9BQU8sQ0FBQyxTQUFSLEdBQTBCOzs7SUFFVCxtQkFBQyxVQUFEO1FBQUMsSUFBQyxDQUFBLGFBQUQ7SUFBRDs7d0JBRWIsUUFBQSxHQUFVLENBQUMsWUFBRDs7d0JBRVYsTUFBQSxHQUFROzt3QkFFUixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixHQUFvQixJQUFDLENBQUE7UUFDckIsSUFBQSxHQUFPLElBQUMsQ0FBQSxVQUFVLENBQUMsT0FBWixDQUFvQixDQUFwQixFQUF1QixRQUF2QjtRQUNQLElBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQyxNQUFaLENBQUEsQ0FBQSxZQUFnQyxpQkFBaEMsSUFBc0QsQ0FBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQVIsQ0FBYyxJQUFkLENBQTdEO1lBQ0ksT0FBZ0IsSUFBQyxDQUFBLE9BQUosR0FBaUIsQ0FBQyxLQUFELEVBQVEsSUFBUixDQUFqQixHQUFvQyxDQUFDLEtBQUQsRUFBUSxJQUFSLENBQWpELEVBQUMsYUFBRCxFQUFNO1lBQ04sSUFBQSxHQUFPLFNBQUEsR0FBVSxJQUFWLEdBQWUsR0FBZixHQUFrQixHQUFsQixHQUFzQixpQkFBdEIsR0FBdUMsR0FBdkMsR0FBMkMsR0FBM0MsR0FBOEMsSUFBOUMsR0FBbUQsR0FBbkQsR0FBc0QsR0FBdEQsR0FBMEQsUUFGckU7U0FBQSxNQUFBO1lBS0ksSUFBQSxHQUFVLElBQUQsR0FBTSxHQUFOLEdBQVEsQ0FBSSxJQUFDLENBQUEsT0FBSixHQUFpQixJQUFqQixHQUEyQixJQUE1QixDQUFSLEdBQXlDLFFBTHREOztlQU1BLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBYSxDQUFDLENBQUMsS0FBRixJQUFXLFVBQWQsR0FBOEIsSUFBOUIsR0FBd0MsR0FBQSxHQUFJLElBQUosR0FBUyxHQUEzRCxDQUFEO0lBVFM7Ozs7R0FSMkI7O0FBK0I1QyxPQUFPLENBQUMsTUFBUixHQUF1Qjs7O0lBRU4sZ0JBQUMsS0FBRDtRQUFDLElBQUMsQ0FBQSxPQUFEO0lBQUQ7O3FCQUViLFFBQUEsR0FBVSxDQUFDLE1BQUQ7O3FCQUVWLE1BQUEsR0FBVyxTQUFBO2VBQUcsSUFBQyxDQUFBO0lBQUo7O3FCQUNYLFNBQUEsR0FBVyxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQUE7SUFBSDs7cUJBRVgsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7UUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQUE7UUFDUCxJQUFHLElBQUEsWUFBZ0IsS0FBaEIsSUFBMEIsSUFBSSxDQUFDLFFBQUwsQ0FBQSxDQUE3QjtZQUNJLElBQUksQ0FBQyxLQUFMLEdBQWEsSUFBQyxDQUFBO0FBQ2QsbUJBQU8sSUFBSSxDQUFDLGtCQUFMLENBQXdCLENBQXhCLEVBRlg7O1FBR0EsU0FBQSxHQUFZLElBQUksQ0FBQyxrQkFBTCxDQUF3QixDQUF4QixFQUEyQixXQUEzQjtRQUNaLElBQUEsR0FBTyxDQUFDLENBQUMsS0FBRixHQUFVLFFBQVYsSUFBdUIsQ0FBQyxJQUFBLFlBQWdCLEVBQWhCLElBQXNCLElBQUEsWUFBZ0IsSUFBdEMsSUFDM0IsQ0FBQyxJQUFBLFlBQWdCLEdBQWhCLElBQXdCLElBQUksQ0FBQyxPQUE5QixDQUQwQixDQUF2QixJQUN5QyxDQUFDLENBQUMsQ0FBQyxLQUFGLEdBQVUsVUFBVixJQUN6QyxTQUFTLENBQUMsTUFBVixJQUFvQixDQURvQjtRQUVoRCxJQUFHLElBQUg7bUJBQWEsVUFBYjtTQUFBLE1BQUE7bUJBQTRCLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZCxFQUE1Qjs7SUFUUzs7OztHQVRxQjs7QUE0QnRDLE9BQU8sQ0FBQyx3QkFBUixHQUF5Qzs7Ozs7Ozt1Q0FFckMsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQU1ULFlBQUE7UUFBQSxJQUFBLENBQU8sQ0FBQyxDQUFDLG9CQUFUO0FBQ0ksbUJBQU8sMkRBQUEsU0FBQSxFQURYOztRQUdBLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBQTtRQUVQLFFBQUEsR0FBVztRQUNYLElBQUksQ0FBQyxnQkFBTCxDQUFzQixLQUF0QixFQUEwQixTQUFDLElBQUQ7WUFDdEIsSUFBRyxJQUFBLFlBQWdCLGFBQW5CO2dCQUNJLFFBQVEsQ0FBQyxJQUFULENBQWMsSUFBZDtBQUNBLHVCQUFPLEtBRlg7YUFBQSxNQUdLLElBQUcsSUFBQSxZQUFnQixNQUFuQjtnQkFDRCxRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQ7QUFDQSx1QkFBTyxNQUZOOztBQUdMLG1CQUFPO1FBUGUsQ0FBMUI7UUFTQSxTQUFBLEdBQVk7UUFDWixTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFmO0FBQ0EsYUFBQSw0Q0FBQTs7WUFDSSxJQUFHLE9BQUEsWUFBbUIsYUFBdEI7Z0JBQ0ksS0FBQSxHQUFRLE9BQU8sQ0FBQyxLQUFNO2dCQUV0QixLQUFBLEdBQVEsS0FBSyxDQUFDLE9BQU4sQ0FBYyxnQkFBZCxFQUFnQyxTQUFDLEtBQUQsRUFBUSxXQUFSLEVBQXFCLFdBQXJCO29CQUNwQyxJQUFHLFdBQVcsQ0FBQyxNQUFaLEdBQXFCLENBQXJCLEtBQTBCLENBQTdCOytCQUNPLFdBQUQsR0FBYSxJQUFiLEdBQWlCLFlBRHZCO3FCQUFBLE1BQUE7K0JBR0ksTUFISjs7Z0JBRG9DLENBQWhDO2dCQUtSLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQWYsRUFSSjthQUFBLE1BQUE7Z0JBVUksU0FBUyxDQUFDLElBQVYsQ0FBZSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBZjtnQkFDQSxTQUFTLENBQUMsSUFBVixrQkFBZSxPQUFPLENBQUMsa0JBQVIsQ0FBMkIsQ0FBM0IsRUFBOEIsV0FBOUIsQ0FBZjtnQkFDQSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFmLEVBWko7O0FBREo7UUFjQSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUMsQ0FBQSxRQUFELENBQVUsR0FBVixDQUFmO2VBRUE7SUF2Q1M7Ozs7R0FGeUQ7O0FBeUQxRSxPQUFPLENBQUMsR0FBUixHQUFvQjs7O0lBQ0gsYUFBQyxJQUFELEVBQU8sTUFBUDtBQUNULFlBQUE7UUFBQyxJQUFDLENBQUEsZ0JBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxlQUFBLEtBQVgsRUFBa0IsSUFBQyxDQUFBLGNBQUEsSUFBbkIsRUFBeUIsSUFBQyxDQUFBLGNBQUEsSUFBMUIsRUFBZ0MsSUFBQyxDQUFBLGVBQUE7UUFDakMsSUFBQyxDQUFBLElBQUQsR0FBVSxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsSUFBRCxDQUFYO1FBQ1YsSUFBQyxDQUFBLEdBQUQsR0FBVSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ25CLElBQUMsQ0FBQSxNQUFELEdBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNuQixJQUFDLENBQUEsSUFBRCxHQUFVLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsSUFBaUQsSUFBQyxDQUFBLElBQUQsSUFBVSxJQUFDLENBQUEsS0FBNUQ7WUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBYSxnQ0FBYixFQUFBOztRQUNBLElBQW1GLElBQUMsQ0FBQSxHQUFELElBQVMsQ0FBSSxJQUFDLENBQUEsTUFBakc7WUFBQSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQWQsQ0FBb0IsMEJBQUEsR0FBMEIsQ0FBSSxJQUFDLENBQUEsSUFBSixHQUFjLE1BQWQsR0FBMEIsSUFBM0IsQ0FBOUMsRUFBQTs7UUFDQSxJQUFxQyxJQUFDLENBQUEsTUFBdEM7WUFBQSxPQUFrQixDQUFDLElBQUMsQ0FBQSxLQUFGLEVBQVMsSUFBQyxDQUFBLElBQVYsQ0FBbEIsRUFBQyxJQUFDLENBQUEsY0FBRixFQUFRLElBQUMsQ0FBQSxnQkFBVDs7UUFDQSxJQUFnRSxJQUFDLENBQUEsS0FBRCxZQUFrQixLQUFsQixJQUE0QixDQUFJLElBQUMsQ0FBQSxLQUFLLENBQUMsWUFBUCxDQUFBLENBQWhHO1lBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQWEsK0NBQWIsRUFBQTs7UUFDQSxJQUFDLENBQUEsS0FBRCxHQUFXLElBQUMsQ0FBQSxNQUFELFlBQW1CLEtBQW5CLElBQTZCLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixZQUF3QixLQUFyRCxJQUErRCxDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQXRGLElBQWlHLENBQUksSUFBQyxDQUFBO1FBQ2pILElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLElBQUQsWUFBaUI7UUFDNUIsSUFBc0QsSUFBQyxDQUFBLEtBQUQsSUFBVyxJQUFDLENBQUEsS0FBbEU7WUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBYSxxQ0FBYixFQUFBOztRQUNBLElBQXVELElBQUMsQ0FBQSxLQUFELElBQVcsSUFBQyxDQUFBLE9BQW5FO1lBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQVksdUNBQVosRUFBQTs7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXO0lBZEY7O2tCQWdCYixRQUFBLEdBQVUsQ0FBQyxNQUFELEVBQVMsUUFBVCxFQUFtQixPQUFuQixFQUE0QixNQUE1Qjs7a0JBTVYsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7UUFBQSxJQUFBLEdBQWMsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLElBQUMsQ0FBQSxJQUFGLENBQVg7UUFDZCxPQUFjLElBQUksQ0FBQyxXQUFuQixFQUFNO1FBQ04sb0JBQW9CLElBQUksQ0FBRSxLQUFOLENBQUEsV0FBQSxZQUF5QixNQUE3QztZQUFBLElBQUMsQ0FBQSxPQUFELEdBQWMsTUFBZDs7UUFDQSxNQUFBLEdBQWlCLElBQUMsQ0FBQSxLQUFKLEdBQWUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUF2QixHQUFpQyxJQUFDLENBQUE7UUFDaEQsS0FBQSxHQUFjLENBQUMsQ0FBQztRQUNoQixJQUEwRCxDQUFJLElBQUMsQ0FBQSxPQUEvRDtZQUFBLElBQUEsR0FBYyxJQUFDLENBQUEsSUFBRCxJQUFXLENBQUMsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQWMsQ0FBZCxFQUFpQixVQUFqQixDQUFELEVBQXpCOztRQUNBLEtBQUEsR0FBYyxJQUFDLENBQUEsS0FBRCxJQUFXLENBQUMsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQWUsQ0FBZixFQUFrQixVQUFsQixDQUFEO1FBQ3pCLElBQXFCLElBQUEsSUFBUyxDQUFJLElBQUMsQ0FBQSxPQUFuQztZQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQUFBOztRQUNBLElBQXFCLEtBQUEsSUFBVSxDQUFBLENBQUEsSUFBQyxDQUFBLEtBQUQsWUFBc0IsS0FBdEIsQ0FBL0I7WUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsRUFBQTs7UUFDQSxJQUF1QyxJQUFDLENBQUEsT0FBeEM7WUFBQSxJQUFBLEdBQU8sS0FBSyxDQUFDLFlBQU4sQ0FBbUIsU0FBbkIsRUFBUDs7UUFDQSxJQUFHLElBQUMsQ0FBQSxJQUFKO1lBQ0ksSUFBK0MsSUFBQyxDQUFBLE9BQWhEO2dCQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsWUFBTixDQUFtQixHQUFuQixFQUF3QjtvQkFBQSxNQUFBLEVBQVEsSUFBUjtpQkFBeEIsRUFBUDthQURKO1NBQUEsTUFBQTtZQUdJLElBQUEsR0FBTyxDQUFDLElBQUMsQ0FBQSxNQUFELElBQVksS0FBYixDQUFBLElBQXVCLEtBQUssQ0FBQyxZQUFOLENBQW1CLEdBQW5CLEVBQXdCO2dCQUFBLE1BQUEsRUFBUSxJQUFSO2FBQXhCLEVBSGxDOztRQUlBLElBQUEsR0FBTyxDQUFDLENBQUMsSUFBQyxDQUFBLEtBQUQsSUFBVSxJQUFDLENBQUEsSUFBWixDQUFBLElBQXNCLElBQXZCLENBQUEsSUFBZ0MsS0FBaEMsSUFBeUM7UUFDaEQsVUFBQSxHQUFpQixJQUFBLEtBQVEsSUFBWCxHQUF3QixJQUFELEdBQU0sS0FBN0IsR0FBdUM7UUFDckQsSUFBRyxJQUFDLENBQUEsSUFBRCxJQUFVLENBQUksSUFBQyxDQUFBLEtBQWxCO1lBQ0ksT0FBa0IsSUFBQyxDQUFBLG9CQUFELENBQXNCLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFZLENBQVosRUFBZSxVQUFmLEVBQTJCLHFCQUEzQixDQUF0QixDQUFsQixFQUFDLGNBQUQsRUFBTztZQUNQLElBQTRCLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBTixDQUFBLENBQTVCO2dCQUFBLE9BQUEsR0FBVSxNQUFBLENBQU8sT0FBUCxFQUFWO2FBRko7O1FBR0EsSUFBb0IsSUFBQyxDQUFBLE9BQXJCO1lBQUEsSUFBQSxHQUFZLEtBQVo7O1FBQ0EsT0FBQSxHQUFZO1FBQ1osU0FBQSxHQUFZO1FBQ1osT0FBQSxHQUFZO1FBQ1osSUFBQSxHQUFZLElBQUMsQ0FBQSxHQUFELEdBQU87UUFDbkIsSUFBRyxJQUFDLENBQUEsS0FBSjtZQUNJLGdCQUFBLEdBQW1CLE1BQU0sQ0FBQyxrQkFBUCxDQUEwQixLQUFBLENBQU0sQ0FBTixFQUN6QztnQkFBQyxLQUFBLEVBQU8sSUFBUjtnQkFBYyxNQUFBLElBQWQ7Z0JBQXFCLE1BQUQsSUFBQyxDQUFBLElBQXJCO2dCQUEyQixTQUFBLEVBQVcscUJBQXRDO2FBRHlDLENBQTFCLEVBRHZCO1NBQUEsTUFBQTtZQUlJLElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsQ0FBaEIsRUFBbUIsVUFBbkI7WUFDUCxJQUFHLENBQUMsSUFBQSxJQUFRLElBQUMsQ0FBQSxHQUFWLENBQUEsSUFBbUIsQ0FBQSxDQUFBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFBLENBQUEsWUFBZ0MsaUJBQWhDLENBQXRCO2dCQUNJLE9BQUEsSUFBVyxFQUFBLEdBQUcsSUFBQyxDQUFBLEdBQUosR0FBUyxDQUFDLEdBQUEsR0FBTSxLQUFLLENBQUMsWUFBTixDQUFtQixLQUFuQixDQUFQLENBQVQsR0FBeUMsS0FBekMsR0FBOEMsSUFBOUMsR0FBbUQ7Z0JBQzlELElBQUEsR0FBTyxJQUZYOztZQUdBLElBQUcsSUFBQSxJQUFTLENBQUksSUFBQyxDQUFBLE9BQWQsSUFBMEIsQ0FBSSxJQUFDLENBQUEsSUFBbEM7Z0JBQ0ksUUFBQSxHQUFjLElBQUQsR0FBTSxLQUFOLEdBQVcsSUFBWCxHQUFnQixHQUFoQixHQUFtQixJQUFuQixHQUF3QixJQUR6Qzs7WUFFQSxJQUFHLENBQUksSUFBQyxDQUFBLE1BQUwsSUFBZ0IsQ0FBSSxJQUFDLENBQUEsSUFBeEI7Z0JBQ0ksSUFBa0MsSUFBQSxLQUFRLE9BQTFDO29CQUFBLE9BQUEsSUFBVyxFQUFBLEdBQUcsSUFBQyxDQUFBLEdBQUosR0FBVSxJQUFWLEdBQWUsTUFBMUI7O2dCQUNBLElBQUEsR0FBTyxPQUFBLEdBQVU7Z0JBQ2pCLElBQUEsQ0FBQSxDQUF1QyxJQUFDLENBQUEsSUFBRCxJQUFVLGlCQUFWLElBQXVCLElBQTlELENBQUE7b0JBQUEsSUFBQSxHQUFPLEtBQUssQ0FBQyxZQUFOLENBQW1CLEtBQW5CLEVBQVA7O2dCQUNBLE9BQUEsR0FBVSxFQUFBLEdBQUcsVUFBSCxHQUFnQixJQUFoQixHQUFxQixRQUFyQixHQUE2QixJQUE3QixHQUFrQyxLQUFsQyxHQUF1QyxJQUF2QyxHQUE0QztnQkFDdEQsV0FBQSxHQUFjLEVBQUEsR0FBRyxVQUFILEdBQWdCLElBQWhCLEdBQXFCLEtBQXJCLEdBQTBCLElBQTFCLEdBQStCO2dCQUM3QyxPQUFBLEdBQWEsSUFBRCxHQUFNLEtBQU4sR0FBVztnQkFDdkIsV0FBQSxHQUFpQixJQUFELEdBQU07Z0JBQ3RCLElBQUcsSUFBQyxDQUFBLElBQUo7b0JBQ0ksSUFBRyxlQUFIO3dCQUNJLElBQUcsSUFBSDs0QkFDSSxPQUFBLEdBQVU7NEJBQ1YsT0FBQSxHQUFVLFlBRmQ7eUJBREo7cUJBQUEsTUFBQTt3QkFLSSxPQUFBLEdBQWEsT0FBRCxHQUFTLFNBQVQsR0FBa0IsT0FBbEIsR0FBMEIsS0FBMUIsR0FBK0I7d0JBQzNDLE9BQUEsR0FBVSxHQUFBLEdBQUksT0FBSixHQUFZLFVBQVosR0FBc0IsT0FBdEIsR0FBOEIsTUFBOUIsR0FBb0MsV0FBcEMsR0FBZ0QsSUFOOUQ7O29CQU9BLFNBQUEsR0FBZSxJQUFELEdBQU0sTUFBTixHQUFZLFFBUjlCO2lCQUFBLE1BQUE7b0JBVUksU0FBQSxHQUFZLEVBQUEsR0FBRSxDQUFJLElBQUEsS0FBUSxJQUFYLEdBQXFCLElBQUEsR0FBSyxJQUExQixHQUF5QyxJQUFELEdBQU0sSUFBL0MsRUFWbEI7O2dCQVdBLGdCQUFBLEdBQW1CLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBYSxPQUFELEdBQVMsSUFBVCxHQUFhLE9BQWIsR0FBcUIsSUFBckIsR0FBeUIsVUFBekIsR0FBc0MsU0FBbEQsQ0FBRCxFQW5CdkI7YUFWSjs7UUE4QkEsSUFBRyxJQUFDLENBQUEsT0FBSjtZQUNJLFVBQUEsR0FBZSxFQUFBLEdBQUcsSUFBQyxDQUFBLEdBQUosR0FBVSxJQUFWLEdBQWU7WUFDOUIsWUFBQSxHQUFlLElBQUEsR0FBSyxJQUFDLENBQUEsR0FBTixHQUFVLFNBQVYsR0FBbUIsSUFBbkIsR0FBd0I7WUFDdkMsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsSUFBaEIsRUFISjs7UUFJQSxJQUFHLElBQUMsQ0FBQSxLQUFKO1lBQ0ksSUFBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQWpCLEdBQTBCLENBQTdCO2dCQUNJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBakIsQ0FBeUIsSUFBSSxFQUFKLENBQU8sQ0FBQyxJQUFJLE1BQUosQ0FBVyxJQUFDLENBQUEsS0FBWixDQUFELENBQW1CLENBQUMsTUFBcEIsQ0FBQSxDQUFQLEVBQXFDLElBQUksZ0JBQUosQ0FBcUIsVUFBckIsQ0FBckMsQ0FBekIsRUFESjthQUFBLE1BQUE7Z0JBR0ksSUFBMkMsSUFBQyxDQUFBLEtBQTVDO29CQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsSUFBSSxFQUFKLENBQU8sSUFBQyxDQUFBLEtBQVIsRUFBZSxJQUFmLENBQUQsQ0FBWCxFQUFQO2lCQUhKO2FBREo7O1FBS0EsSUFBRyxJQUFDLENBQUEsT0FBSjtZQUNJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBakIsQ0FBeUIsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLElBQVosRUFBcUIsSUFBQyxDQUFBLElBQUosR0FBYyxJQUFJLGlCQUFKLENBQXNCLElBQXRCLENBQWQsR0FBOEMsSUFBSSxPQUFKLENBQWUsSUFBRCxHQUFNLEdBQU4sR0FBUyxJQUFULEdBQWMsR0FBNUIsQ0FBaEUsQ0FBekIsRUFESjs7UUFFQSxnQkFBQSxHQUFtQixFQUFFLENBQUMsTUFBSCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsT0FBVixDQUFWLEVBQThCLElBQUMsQ0FBQSxlQUFELENBQWlCLENBQWpCLEVBQW9CLElBQXBCLENBQTlCO1FBQ25CLElBQXFDLFFBQXJDO1lBQUEsT0FBQSxHQUFVLElBQUEsR0FBSyxJQUFMLEdBQVksUUFBWixHQUFxQixJQUEvQjs7UUFDQSxJQUFHLElBQUMsQ0FBQSxNQUFKO1lBQ0ksZ0JBQUEsR0FBbUIsQ0FBQyxJQUFDLENBQUEsUUFBRCxDQUFhLElBQUQsR0FBTSxNQUFOLEdBQVksSUFBeEIsQ0FBRDtZQUNuQixJQUF5RixJQUFDLENBQUEsR0FBMUY7Z0JBQUEsU0FBQSxHQUFZLElBQUEsR0FBSyxJQUFMLEdBQVUsT0FBVixHQUFnQixDQUFDLE9BQUEsQ0FBUSxTQUFSLEVBQW1CLENBQW5CLENBQUQsQ0FBaEIsR0FBc0MsUUFBdEMsR0FBOEMsSUFBOUMsR0FBbUQsSUFBbkQsR0FBdUQsSUFBdkQsR0FBNEQsZUFBeEU7YUFGSjtTQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsSUFBSjtZQUNELGdCQUFBLEdBQW1CLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBYSxJQUFELEdBQU0sTUFBTixHQUFZLElBQXhCLENBQUQsRUFEbEI7O1FBRUwsYUFBQSxHQUFnQixJQUFJLENBQUMsa0JBQUwsQ0FBd0IsS0FBQSxDQUFNLENBQU4sRUFBUztZQUFBLE1BQUEsRUFBUSxJQUFSO1NBQVQsQ0FBeEIsRUFBZ0QsU0FBaEQ7UUFDaEIsSUFBRyxhQUFBLElBQWtCLGFBQWEsQ0FBQyxNQUFkLEdBQXVCLENBQTVDO1lBQ0ksYUFBQSxHQUFnQixFQUFFLENBQUMsTUFBSCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFWLEVBQTJCLGFBQTNCLEVBQTBDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUExQyxFQURwQjs7ZUFFQSxFQUFFLENBQUMsTUFBSCxDQUFVLGdCQUFWLEVBQTRCLElBQUMsQ0FBQSxRQUFELENBQVUsRUFBQSxHQUFFLENBQUMsVUFBQSxJQUFjLEVBQWYsQ0FBRixHQUFzQixJQUFDLENBQUEsR0FBdkIsR0FBMkIsT0FBckMsQ0FBNUIsRUFDSSxnQkFESixFQUNzQixJQUFDLENBQUEsUUFBRCxDQUFVLEtBQUEsR0FBTSxTQUFOLEdBQWtCLE9BQTVCLENBRHRCLEVBQzhELGFBRDlELEVBRUksSUFBQyxDQUFBLFFBQUQsQ0FBYSxJQUFDLENBQUEsR0FBRixHQUFNLEdBQU4sR0FBUSxDQUFDLFlBQUEsSUFBZ0IsRUFBakIsQ0FBcEIsQ0FGSjtJQTVFUzs7a0JBZ0ZiLGVBQUEsR0FBaUIsU0FBQyxDQUFELEVBQUksSUFBSjtBQUNiLFlBQUE7UUFBQSxJQUFBLEdBQU87QUFDUDtBQUFBLGFBQUEsb0RBQUE7O1lBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFMLENBQUE7WUFDUCxJQUFBLENBQUEsQ0FBZ0IsSUFBQSxZQUFnQixJQUFoQyxDQUFBO0FBQUEseUJBQUE7O1lBQ0EsR0FBQSx3Q0FBbUIsQ0FBRSxTQUFmLENBQUE7WUFDTixJQUFBLENBQUEsQ0FBZ0IsQ0FBQyxHQUFBLFlBQWUsSUFBaEIsQ0FBQSxJQUNnQixDQUFDLEdBQUEsWUFBZSxLQUFmLHFDQUNPLENBQUUsU0FBVixDQUFBLFdBQUEsWUFBaUMsSUFEaEMsSUFFRCxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQWYsS0FBeUIsQ0FGeEIsSUFHRCx1REFBc0IsQ0FBRSxlQUF4QixLQUFrQyxNQUFsQyxJQUFBLElBQUEsS0FBMEMsT0FBMUMsQ0FIQSxDQURoQyxDQUFBO0FBQUEseUJBQUE7O1lBS0EsRUFBQSxvQ0FBa0IsQ0FBRSxTQUFWLENBQUEsV0FBQSxJQUF5QjtZQUNuQyxHQUFBLEdBQVUsSUFBSSxpQkFBSixDQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVIsQ0FBcUIsSUFBckIsQ0FBdEI7WUFDVixJQUFBLEdBQVUsSUFBSSxLQUFKLENBQVUsR0FBVjtZQUNWLElBQUcsR0FBRyxDQUFDLElBQVA7Z0JBQ0ksT0FBbUIsQ0FBQyxJQUFELEVBQU8sR0FBUCxDQUFuQixFQUFDLEdBQUcsQ0FBQyxjQUFMLEVBQVcsZUFEZjs7WUFFQSxJQUFJLENBQUMsV0FBWSxDQUFBLEdBQUEsQ0FBakIsR0FBd0IsSUFBSSxJQUFKLENBQVMsSUFBVCxFQUFlLElBQUksQ0FBQyxJQUFwQjtZQUN4QixJQUFBLEdBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxHQUFYLENBQVosRUFBOEIsSUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixFQUFoQixDQUFtQixDQUFDLGtCQUFwQixDQUF1QyxDQUF2QyxFQUEwQyxTQUExQyxDQUE5QixFQUFxRixJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsQ0FBckY7QUFmWDtlQWdCQTtJQWxCYTs7OztHQXZHVzs7QUFtSWhDLE9BQU8sQ0FBQyxNQUFSLEdBQXVCOzs7SUFDTixnQkFBQyxPQUFELEVBQVcsS0FBWCxFQUFtQixTQUFuQjtRQUFDLElBQUMsQ0FBQSxVQUFEO1FBQVUsSUFBQyxDQUFBLFFBQUQ7UUFBUSxJQUFDLENBQUEsWUFBRDtJQUFuQjs7cUJBRWIsUUFBQSxHQUFVLENBQUMsU0FBRCxFQUFZLE9BQVosRUFBcUIsV0FBckI7O3FCQUVWLFdBQUEsR0FBYTs7cUJBRWIsS0FBQSxHQUFPLFNBQUMsQ0FBRDtBQUNILFlBQUE7O1lBREksSUFBSTtnQkFBQyxLQUFBLEVBQU8sSUFBUjs7O0FBQ1I7QUFBQSxhQUFBLHdDQUFBOzRCQUFLLGlCQUFPO1lBQ1IsSUFBbUIsUUFBQSxHQUFXLEtBQUssQ0FBQyxLQUFOLENBQVksQ0FBWixDQUE5QjtBQUFBLHVCQUFPLFNBQVA7O0FBREo7cURBRVUsQ0FBRSxLQUFaLENBQWtCLENBQWxCO0lBSEc7O3FCQUtQLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDUixZQUFBO0FBQUE7QUFBQSxhQUFBLHdDQUFBOztZQUFBLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxVQUFSLENBQW1CLEdBQW5CO0FBQUE7UUFDQSxJQUFtRCxHQUFuRDtZQUFBLElBQUMsQ0FBQSxjQUFELElBQUMsQ0FBQSxZQUFjLElBQUksS0FBSixDQUFVLENBQUMsSUFBSSxPQUFKLENBQVksUUFBWixDQUFELENBQVYsR0FBZjs7O2dCQUNVLENBQUUsVUFBWixDQUF1QixHQUF2Qjs7ZUFDQTtJQUpROztxQkFNWixXQUFBLEdBQWEsU0FBQyxDQUFEO0FBQ1QsWUFBQTtRQUFBLElBQUEsR0FBTyxDQUFDLENBQUMsTUFBRixHQUFXO1FBQ2xCLElBQUEsR0FBTyxDQUFDLENBQUMsTUFBRixHQUFXLElBQUEsR0FBTztRQUN6QixTQUFBLEdBQVksRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUMsQ0FBQSxHQUFELEdBQU8sVUFBakIsQ0FBVixFQUNSLENBQUksSUFBQyxDQUFBLE9BQUosR0FBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxrQkFBVCxDQUE0QixDQUE1QixFQUErQixXQUEvQixDQUFqQixHQUFrRSxJQUFDLENBQUEsUUFBRCxDQUFVLE9BQVYsQ0FBbkUsQ0FEUSxFQUVSLElBQUMsQ0FBQSxRQUFELENBQVUsT0FBVixDQUZRO0FBR1o7QUFBQSxhQUFBLGdEQUFBOzRCQUFLLHNCQUFZO0FBQ2I7QUFBQSxpQkFBQSx3Q0FBQTs7Z0JBQ0ksSUFBQSxDQUErQixJQUFDLENBQUEsT0FBaEM7b0JBQUEsSUFBQSxHQUFVLElBQUksQ0FBQyxNQUFMLENBQUEsRUFBVjs7Z0JBQ0EsU0FBQSxHQUFZLFNBQVMsQ0FBQyxNQUFWLENBQWlCLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQSxHQUFPLE9BQWpCLENBQWpCLEVBQTRDLElBQUksQ0FBQyxrQkFBTCxDQUF3QixDQUF4QixFQUEyQixXQUEzQixDQUE1QyxFQUFxRixJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsQ0FBckY7QUFGaEI7WUFHQSxJQUFzRCxDQUFDLElBQUEsR0FBTyxLQUFLLENBQUMsa0JBQU4sQ0FBeUIsQ0FBekIsRUFBNEIsU0FBNUIsQ0FBUixDQUE4QyxDQUFDLE1BQS9DLEdBQXdELENBQTlHO2dCQUFBLFNBQUEsR0FBWSxTQUFTLENBQUMsTUFBVixDQUFpQixJQUFqQixFQUF1QixJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsQ0FBdkIsRUFBWjs7WUFDQSxJQUFTLENBQUEsS0FBSyxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsR0FBZ0IsQ0FBckIsSUFBMkIsQ0FBSSxJQUFDLENBQUEsU0FBekM7QUFBQSxzQkFBQTs7WUFDQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsS0FBSyxDQUFDLFdBQXRCO1lBQ1AsSUFBWSxJQUFBLFlBQWdCLE1BQWhCLElBQTBCLENBQUMsSUFBQSxZQUFnQixPQUFoQixJQUE0QixJQUFJLENBQUMsS0FBTCxDQUFBLENBQTVCLElBQTZDLElBQUksQ0FBQyxLQUFMLEtBQWMsVUFBNUQsQ0FBdEM7QUFBQSx5QkFBQTs7WUFDQSxTQUFTLENBQUMsSUFBVixDQUFlLElBQUksQ0FBQyxRQUFMLENBQWMsSUFBQSxHQUFPLFVBQXJCLENBQWY7QUFSSjtRQVNBLElBQUcsSUFBQyxDQUFBLFNBQUQsSUFBZSxJQUFDLENBQUEsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUF6QztZQUNJLFNBQVMsQ0FBQyxJQUFWLGtCQUFlLENBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFBLEdBQU8sWUFBakIsQ0FBZ0MsU0FBQSxXQUFDLElBQUMsQ0FBQSxTQUFTLENBQUMsa0JBQVgsQ0FBOEIsQ0FBOUIsRUFBaUMsU0FBakMsQ0FBRCxDQUFBLEVBQWlELENBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFWLENBQUEsQ0FBQSxDQUFoRyxFQURKOztRQUVBLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsR0FBRCxHQUFPLEdBQWpCLENBQWY7ZUFDQTtJQWxCUzs7OztHQWxCcUI7O0FBaUR0QyxPQUFPLENBQUMsRUFBUixHQUFtQjs7O0lBRUYsWUFBQyxTQUFELEVBQVksS0FBWixFQUFtQixPQUFuQjtRQUFZLElBQUMsQ0FBQSxPQUFEOztZQUFPLFVBQVU7O1FBQ3RDLElBQUMsQ0FBQSxTQUFELEdBQWdCLE9BQU8sQ0FBQyxJQUFSLEtBQWdCLFFBQW5CLEdBQWlDLFNBQVMsQ0FBQyxNQUFWLENBQUEsQ0FBakMsR0FBeUQ7UUFDdEUsSUFBQyxDQUFBLFFBQUQsR0FBZTtRQUNmLElBQUMsQ0FBQSxPQUFELEdBQWU7UUFDZCxJQUFDLENBQUEsT0FBYSxRQUFiO0lBSk87O2lCQU1iLFFBQUEsR0FBVSxDQUFDLFdBQUQsRUFBYyxNQUFkLEVBQXNCLFVBQXRCOztpQkFFVixRQUFBLEdBQW9CLFNBQUE7QUFBRyxZQUFBO2dEQUFLLENBQUUsTUFBUCxDQUFBO0lBQUg7O2lCQUNwQixZQUFBLEdBQWMsU0FBQTtBQUFHLFlBQUE7b0RBQVMsQ0FBRSxNQUFYLENBQUE7SUFBSDs7aUJBSWQsT0FBQSxHQUFTLFNBQUMsUUFBRDtRQUNMLElBQUcsSUFBQyxDQUFBLE9BQUo7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFBLENBQWUsQ0FBQyxPQUFoQixDQUF3QixRQUF4QixFQURKO1NBQUEsTUFBQTtZQUdJLElBQUMsQ0FBQSxPQUFELEdBQWMsUUFBQSxZQUFvQjtZQUNsQyxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxXQUFELENBQWEsUUFBYjtZQUNaLElBQUMsQ0FBQSxRQUFRLENBQUMsMkJBQVYsQ0FBc0MsUUFBUSxDQUFDLFlBQS9DLEVBTEo7O2VBTUE7SUFQSzs7aUJBWVQsV0FBQSxHQUFhLFNBQUMsQ0FBRDtBQUNULFlBQUE7NEJBQUEsQ0FBQyxDQUFFLGVBQUgsS0FBWSxTQUFaLElBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFXLENBQUMsV0FBWixDQUF3QixDQUF4QixDQURKLGdEQUNpRCxDQUFFLFdBQWpCLENBQTZCLENBQTdCO0lBRnpCOztpQkFJYixLQUFBLEdBQU8sU0FBQyxDQUFEO0FBQU8sWUFBQTtlQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFZLENBQVosQ0FBQSwwQ0FBMkIsQ0FBRSxLQUFYLENBQWlCLENBQWpCO0lBQXpCOztpQkFFUCxXQUFBLEdBQWEsU0FBQyxDQUFEO1FBQ1QsSUFBRyxJQUFDLENBQUEsV0FBRCxDQUFhLENBQWIsQ0FBSDttQkFBdUIsSUFBQyxDQUFBLGdCQUFELENBQWtCLENBQWxCLEVBQXZCO1NBQUEsTUFBQTttQkFBZ0QsSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQW5CLEVBQWhEOztJQURTOztpQkFHYixVQUFBLEdBQVksU0FBQyxHQUFEO1FBQ1IsSUFBcUQsR0FBckQ7WUFBQSxJQUFDLENBQUEsYUFBRCxJQUFDLENBQUEsV0FBZ0IsSUFBSSxLQUFKLENBQVUsQ0FBQyxJQUFJLE9BQUosQ0FBWSxRQUFaLENBQUQsQ0FBVixHQUFqQjs7UUFDQSxJQUFDLENBQUEsU0FBRCxJQUFDLENBQUEsT0FBb0IsSUFBSSxLQUFKLENBQVUsQ0FBQyxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sQ0FBaUIsR0FBakIsQ0FBRCxDQUFWO1FBQ3JCLElBQUMsQ0FBQSxhQUFELElBQUMsQ0FBQSxXQUFjLElBQUksS0FBSixDQUFVLENBQUMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUFWLENBQXFCLEdBQXJCLENBQUQsQ0FBVjtlQUNmO0lBSlE7O2lCQU1aLFdBQUEsR0FBYSxTQUFDLElBQUQ7UUFDVCxJQUFHLElBQUEsWUFBZ0IsS0FBbkI7bUJBQThCLEtBQTlCO1NBQUEsTUFBQTttQkFBd0MsSUFBSSxLQUFKLENBQVUsQ0FBQyxJQUFELENBQVYsRUFBeEM7O0lBRFM7O2lCQUliLGdCQUFBLEdBQWtCLFNBQUMsQ0FBRDtBQUNkLFlBQUE7UUFBQSxLQUFBLEdBQWUsR0FBQSxDQUFJLENBQUosRUFBTyxZQUFQO1FBQ2YsSUFBQSxHQUFlLEdBQUEsQ0FBSSxDQUFKLEVBQU8scUJBQVA7UUFFZixJQUFHLElBQUg7QUFDSSxtQkFBTyxJQUFJLEVBQUosQ0FBTyxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsQ0FBQSxDQUFQLEVBQTRCLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBNUIsRUFBNkM7Z0JBQUEsSUFBQSxFQUFNLElBQU47YUFBN0MsQ0FBd0QsQ0FBQyxrQkFBekQsQ0FBNEUsQ0FBNUUsRUFEWDs7UUFHQSxNQUFBLEdBQVcsQ0FBQyxDQUFDLE1BQUYsR0FBVztRQUN0QixJQUFBLEdBQWUsSUFBQyxDQUFBLFNBQVMsQ0FBQyxrQkFBWCxDQUE4QixDQUE5QixFQUFpQyxXQUFqQztRQUNmLElBQUEsR0FBZSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxJQUFkLENBQW1CLENBQUMsa0JBQXBCLENBQXVDLEtBQUEsQ0FBTSxDQUFOLEVBQVM7WUFBQyxRQUFBLE1BQUQ7U0FBVCxDQUF2QztRQUNmLE1BQUEsR0FBVyxFQUFFLENBQUMsTUFBSCxDQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBVixDQUFWLEVBQTZCLElBQTdCLEVBQW1DLElBQUMsQ0FBQSxRQUFELENBQVUsT0FBVixDQUFuQyxFQUF1RCxJQUF2RCxFQUE2RCxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUEsR0FBSyxJQUFDLENBQUEsR0FBTixHQUFVLEdBQXBCLENBQTdEO1FBQ1gsSUFBQSxDQUFxQyxLQUFyQztZQUFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsR0FBWCxDQUFmLEVBQUE7O1FBQ0EsSUFBQSxDQUFxQixJQUFDLENBQUEsUUFBdEI7QUFBQSxtQkFBTyxPQUFQOztRQUNBLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxRQUFELENBQVUsUUFBVixDQUFkO1FBQ1QsSUFBRyxJQUFDLENBQUEsT0FBSjtZQUNJLENBQUMsQ0FBQyxVQUFGLEdBQWU7WUFDZixNQUFBLEdBQVMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBQSxDQUFrQixDQUFDLGtCQUFuQixDQUFzQyxDQUF0QyxFQUF5QyxTQUF6QyxDQUFkLEVBRmI7U0FBQSxNQUFBO1lBSUksTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFQLENBQWMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQWQsRUFBZ0MsSUFBQyxDQUFBLFFBQVEsQ0FBQyxrQkFBVixDQUE2QixLQUFBLENBQU0sQ0FBTixFQUFTO2dCQUFDLFFBQUEsTUFBRDthQUFULENBQTdCLEVBQWlELFNBQWpELENBQWhDLEVBQTZGLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQSxHQUFLLElBQUMsQ0FBQSxHQUFOLEdBQVUsR0FBcEIsQ0FBN0YsRUFKYjs7ZUFLQTtJQW5CYzs7aUJBc0JsQixpQkFBQSxHQUFtQixTQUFDLENBQUQ7QUFDZixZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxTQUFTLENBQUMsa0JBQVgsQ0FBOEIsQ0FBOUIsRUFBaUMsVUFBakM7UUFDUCxJQUFBLEdBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFXLENBQUMsa0JBQVosQ0FBK0IsQ0FBL0IsRUFBa0MsVUFBbEM7UUFDUCxHQUFBLEdBQVUsSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFILEdBQXdCLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBZSxDQUFDLGtCQUFoQixDQUFtQyxDQUFuQyxFQUFzQyxVQUF0QyxDQUF4QixHQUErRSxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsUUFBVixDQUFEO1FBQ3RGLFNBQUEsR0FBWSxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBVixDQUFaLEVBQThCLElBQTlCLEVBQW9DLElBQUMsQ0FBQSxRQUFELENBQVUsS0FBVixDQUFwQyxFQUFzRCxHQUF0RDtRQUNaLElBQUcsQ0FBQyxDQUFDLEtBQUYsSUFBVyxVQUFkO21CQUE4QixJQUFDLENBQUEsWUFBRCxDQUFjLFNBQWQsRUFBOUI7U0FBQSxNQUFBO21CQUEyRCxVQUEzRDs7SUFMZTs7aUJBT25CLFVBQUEsR0FBWSxTQUFBO2VBQ1IsSUFBQyxDQUFBLElBQUQsSUFBVTtJQURGOzs7O0dBM0VjOztBQW9GOUIsU0FBQSxHQUtJO0lBQUEsTUFBQSxFQUFRLFNBQUMsQ0FBRDtlQUFPLDBEQUFBLEdBR0UsQ0FBQyxPQUFBLENBQVEsU0FBUixFQUFtQixDQUFuQixDQUFELENBSEYsR0FHd0I7SUFIL0IsQ0FBUjtJQWdCQSxJQUFBLEVBQU0sU0FBQTtlQUFHO0lBQUgsQ0FoQk47SUF5QkEsT0FBQSxFQUFTLFNBQUE7ZUFBRztJQUFILENBekJUO0lBa0NBLE1BQUEsRUFBUSxTQUFBO2VBQUc7SUFBSCxDQWxDUjtJQXVDQSxPQUFBLEVBQVMsU0FBQTtlQUFHO0lBQUgsQ0F2Q1Q7SUF3Q0EsS0FBQSxFQUFPLFNBQUE7ZUFBRztJQUFILENBeENQOzs7QUE0Q0osU0FBQSxHQUFlOztBQUNmLFdBQUEsR0FBZTs7QUFDZixVQUFBLEdBQWU7O0FBQ2YsVUFBQSxHQUFlOztBQUNmLFFBQUEsR0FBZTs7QUFDZixZQUFBLEdBQWU7O0FBRWYsR0FBQSxHQUFNOztBQUVOLFNBQUEsR0FBWTs7QUFVWixPQUFBLEdBQVUsU0FBQyxJQUFELEVBQU8sQ0FBUDtBQUNOLFFBQUE7SUFBQyxPQUFRLENBQUMsQ0FBQztJQUNYLElBQUcsSUFBQSxJQUFRLElBQUksQ0FBQyxTQUFoQjtlQUNJLElBQUksQ0FBQyxTQUFVLENBQUEsSUFBQSxFQURuQjtLQUFBLE1BQUE7UUFHSSxHQUFBLEdBQU0sSUFBSSxDQUFDLFlBQUwsQ0FBa0IsSUFBbEI7UUFDTixJQUFJLENBQUMsTUFBTCxDQUFZLEdBQVosRUFBaUIsU0FBVSxDQUFBLElBQUEsQ0FBVixDQUFnQixDQUFoQixDQUFqQjtlQUNBLElBQUksQ0FBQyxTQUFVLENBQUEsSUFBQSxDQUFmLEdBQXVCLElBTDNCOztBQUZNOztBQVNWLFNBQUEsR0FBWSxTQUFDLElBQUQsRUFBTyxHQUFQO0lBQ1IsSUFBQSxHQUFPLElBQUksQ0FBQyxPQUFMLENBQWEsS0FBYixFQUFvQixJQUFBLEdBQU8sR0FBM0I7V0FDUCxJQUFJLENBQUMsT0FBTCxDQUFhLE1BQWIsRUFBcUIsRUFBckI7QUFGUTs7QUFJWixrQkFBQSxHQUFxQixTQUFDLElBQUQ7V0FDakIsSUFBQSxZQUFnQixpQkFBaEIsSUFBc0MsSUFBSSxDQUFDLEtBQUwsS0FBYztBQURuQzs7QUFHckIsYUFBQSxHQUFnQixTQUFDLElBQUQ7V0FDWixJQUFBLFlBQWdCLFdBQWhCLElBQ0ksQ0FBQyxJQUFBLFlBQWdCLElBQWhCLElBQXlCLElBQUksQ0FBQyxLQUEvQixDQURKLElBRUksSUFBQSxZQUFnQjtBQUhSOztBQUtoQixxQkFBQSxHQUF3QixTQUFDLElBQUQ7V0FBVSxJQUFJLENBQUMsU0FBTCxDQUFBLENBQUEsK0NBQW9CLElBQUksQ0FBQztBQUFuQzs7QUFHeEIsVUFBQSxHQUFhLFNBQUMsQ0FBRCxFQUFJLE1BQUosRUFBWSxJQUFaO0FBQ1QsUUFBQTtJQUFBLElBQUEsQ0FBYyxDQUFBLEdBQUEsR0FBTSxNQUFPLENBQUEsSUFBQSxDQUFLLENBQUMsVUFBYixDQUF3QixDQUF4QixDQUFOLENBQWQ7QUFBQSxlQUFBOztJQUNBLE1BQU8sQ0FBQSxJQUFBLENBQVAsR0FBZSxHQUFHLENBQUM7SUFDbkIsR0FBRyxDQUFDLElBQUosR0FBVyxJQUFJLEtBQUosQ0FBVSxNQUFWO1dBQ1g7QUFKUyIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4jIyNcblxuIyBDb250YWlucyBhbGwgb2YgdGhlIG5vZGUgY2xhc3NlcyBmb3IgdGhlIHN5bnRheCB0cmVlLiBcbiMgTW9zdCBub2RlcyBhcmUgY3JlYXRlZCBhcyB0aGUgcmVzdWx0IG9mIGFjdGlvbnMgaW4gdGhlIGdyYW1tYXIsXG4jIGJ1dCBzb21lIGFyZSBjcmVhdGVkIGJ5IG90aGVyIG5vZGVzIGFzIGEgbWV0aG9kIG9mIGNvZGUgZ2VuZXJhdGlvbi4gXG4jIFRvIGNvbnZlcnQgdGhlIHN5bnRheCB0cmVlIGludG8gYSBzdHJpbmcgb2YgSmF2YVNjcmlwdCBjb2RlLCBjYWxsIGBjb21waWxlKClgIG9uIHRoZSByb290LlxuXG5FcnJvci5zdGFja1RyYWNlTGltaXQgPSBJbmZpbml0eVxubG9nID0gY29uc29sZS5sb2dcblxue1Njb3BlfSA9IHJlcXVpcmUgJy4vc2NvcGUnXG57aXNVbmFzc2lnbmFibGUsIEpTX0ZPUkJJRERFTn0gPSByZXF1aXJlICcuL2xleGVyJ1xuXG4jIEltcG9ydCB0aGUgaGVscGVycyB3ZSBwbGFuIHRvIHVzZS5cbntjb21wYWN0LCBmbGF0dGVuLCBleHRlbmQsIG1lcmdlLCBkZWwsIHN0YXJ0cywgZW5kcywgc29tZSxcbmFkZExvY2F0aW9uRGF0YUZuLCBsb2NhdGlvbkRhdGFUb1N0cmluZywgdGhyb3dTeW50YXhFcnJvcn0gPSByZXF1aXJlICcuL2hlbHBlcnMnXG5cbiMgRnVuY3Rpb25zIHJlcXVpcmVkIGJ5IHBhcnNlclxuZXhwb3J0cy5leHRlbmQgPSBleHRlbmRcbmV4cG9ydHMuYWRkTG9jYXRpb25EYXRhRm4gPSBhZGRMb2NhdGlvbkRhdGFGblxuXG4jIENvbnN0YW50IGZ1bmN0aW9ucyBmb3Igbm9kZXMgdGhhdCBkb24ndCBuZWVkIGN1c3RvbWl6YXRpb24uXG5ZRVMgICAgID0gLT4geWVzXG5OTyAgICAgID0gLT4gbm9cblRISVMgICAgPSAtPiB0aGlzXG5ORUdBVEUgID0gLT4gQG5lZ2F0ZWQgPSBub3QgQG5lZ2F0ZWQ7IHRoaXNcblxuIyAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4jIFRoZSB2YXJpb3VzIG5vZGVzIGRlZmluZWQgYmVsb3cgYWxsIGNvbXBpbGUgdG8gYSBjb2xsZWN0aW9uIG9mIENvZGVGcmFnbWVudCBvYmplY3RzLlxuIyBBIENvZGVGcmFnbWVudHMgaXMgYSBibG9jayBvZiBnZW5lcmF0ZWQgY29kZSwgYW5kIHRoZSBsb2NhdGlvbiBpbiB0aGUgc291cmNlIGZpbGUgd2hlcmUgdGhlIGNvZGVcbiMgY2FtZSBmcm9tLiBDb2RlRnJhZ21lbnRzIGNhbiBiZSBhc3NlbWJsZWQgdG9nZXRoZXIgaW50byB3b3JraW5nIGNvZGUganVzdCBieSBjYXR0aW5nIHRvZ2V0aGVyXG4jIGFsbCB0aGUgQ29kZUZyYWdtZW50cycgYGNvZGVgIHNuaXBwZXRzLCBpbiBvcmRlci5cblxuZXhwb3J0cy5Db2RlRnJhZ21lbnQgPSBjbGFzcyBDb2RlRnJhZ21lbnRcbiAgICBcbiAgICBAOiAocGFyZW50LCBjb2RlKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvZGUgPSBcIiN7Y29kZX1cIlxuICAgICAgICBAbG9jYXRpb25EYXRhID0gcGFyZW50Py5sb2NhdGlvbkRhdGFcbiAgICAgICAgQHR5cGUgPSBwYXJlbnQ/LmNvbnN0cnVjdG9yPy5uYW1lIG9yICd1bmtub3duJ1xuXG4gICAgdG9TdHJpbmc6IC0+XG4gICAgICAgIFxuICAgICAgICBcIiN7QGNvZGV9I3tpZiBAbG9jYXRpb25EYXRhIHRoZW4gXCI6IFwiICsgbG9jYXRpb25EYXRhVG9TdHJpbmcoQGxvY2F0aW9uRGF0YSkgZWxzZSAnJ31cIlxuXG5mcmFnbWVudHNUb1RleHQgPSAoZnJhZ21lbnRzKSAtPiAjIENvbnZlcnQgYW4gYXJyYXkgb2YgQ29kZUZyYWdtZW50cyBpbnRvIGEgc3RyaW5nLlxuICAgIFxuICAgIChmcmFnbWVudC5jb2RlIGZvciBmcmFnbWVudCBpbiBmcmFnbWVudHMpLmpvaW4oJycpXG5cbiMgMDAwMDAwMCAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuXG4jIFRoZSAqKkJhc2UqKiBpcyB0aGUgYWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgYWxsIG5vZGVzIGluIHRoZSBzeW50YXggdHJlZS5cbiMgRWFjaCBzdWJjbGFzcyBpbXBsZW1lbnRzIHRoZSBgY29tcGlsZU5vZGVgIG1ldGhvZCwgd2hpY2ggcGVyZm9ybXMgdGhlXG4jIGNvZGUgZ2VuZXJhdGlvbiBmb3IgdGhhdCBub2RlLiBUbyBjb21waWxlIGEgbm9kZSB0byBKYXZhU2NyaXB0LFxuIyBjYWxsIGBjb21waWxlYCBvbiBpdCwgd2hpY2ggd3JhcHMgYGNvbXBpbGVOb2RlYCBpbiBzb21lIGdlbmVyaWMgZXh0cmEgc21hcnRzLFxuIyB0byBrbm93IHdoZW4gdGhlIGdlbmVyYXRlZCBjb2RlIG5lZWRzIHRvIGJlIHdyYXBwZWQgdXAgaW4gYSBjbG9zdXJlLlxuIyBBbiBvcHRpb25zIGhhc2ggaXMgcGFzc2VkIGFuZCBjbG9uZWQgdGhyb3VnaG91dCwgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dFxuIyB0aGUgZW52aXJvbm1lbnQgZnJvbSBoaWdoZXIgaW4gdGhlIHRyZWUgKHN1Y2ggYXMgaWYgYSByZXR1cm5lZCB2YWx1ZSBpc1xuIyBiZWluZyByZXF1ZXN0ZWQgYnkgdGhlIHN1cnJvdW5kaW5nIGZ1bmN0aW9uKSwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnRcbiMgc2NvcGUsIGFuZCBpbmRlbnRhdGlvbiBsZXZlbC5cblxuZXhwb3J0cy5CYXNlID0gY2xhc3MgQmFzZVxuXG4gICAgY29tcGlsZTogKG8sIGx2bCkgLT5cbiAgICAgICAgZnJhZ21lbnRzVG9UZXh0IEBjb21waWxlVG9GcmFnbWVudHMgbywgbHZsXG5cbiAgICAjIENvbW1vbiBsb2dpYyBmb3IgZGV0ZXJtaW5pbmcgd2hldGhlciB0byB3cmFwIHRoaXMgbm9kZSBpbiBhIGNsb3N1cmUgYmVmb3JlXG4gICAgIyBjb21waWxpbmcgaXQsIG9yIHRvIGNvbXBpbGUgZGlyZWN0bHkuIFdlIG5lZWQgdG8gd3JhcCBpZiB0aGlzIG5vZGUgaXMgYVxuICAgICMgKnN0YXRlbWVudCosIGFuZCBpdCdzIG5vdCBhICpwdXJlU3RhdGVtZW50KiwgYW5kIHdlJ3JlIG5vdCBhdFxuICAgICMgdGhlIHRvcCBsZXZlbCBvZiBhIGJsb2NrICh3aGljaCB3b3VsZCBiZSB1bm5lY2Vzc2FyeSksIGFuZCB3ZSBoYXZlbid0XG4gICAgIyBhbHJlYWR5IGJlZW4gYXNrZWQgdG8gcmV0dXJuIHRoZSByZXN1bHQgKGJlY2F1c2Ugc3RhdGVtZW50cyBrbm93IGhvdyB0b1xuICAgICMgcmV0dXJuIHJlc3VsdHMpLlxuICAgIFxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8sIGx2bCkgLT5cbiAgICAgICAgXG4gICAgICAgIG8gICAgICAgID0gZXh0ZW5kIHt9LCBvXG4gICAgICAgIG8ubGV2ZWwgID0gbHZsIGlmIGx2bFxuICAgICAgICBub2RlICAgICA9IEB1bmZvbGRTb2FrKG8pIG9yIHRoaXNcbiAgICAgICAgbm9kZS50YWIgPSBvLmluZGVudFxuICAgICAgICBpZiBvLmxldmVsIGlzIExFVkVMX1RPUCBvciBub3Qgbm9kZS5pc1N0YXRlbWVudChvKVxuICAgICAgICAgICAgbm9kZS5jb21waWxlTm9kZSBvXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5vZGUuY29tcGlsZUNsb3N1cmUgb1xuXG4gICAgIyBTdGF0ZW1lbnRzIGNvbnZlcnRlZCBpbnRvIGV4cHJlc3Npb25zIHZpYSBjbG9zdXJlLXdyYXBwaW5nIHNoYXJlIGEgc2NvcGVcbiAgICAjIG9iamVjdCB3aXRoIHRoZWlyIHBhcmVudCBjbG9zdXJlLCB0byBwcmVzZXJ2ZSB0aGUgZXhwZWN0ZWQgbGV4aWNhbCBzY29wZS5cbiAgICBcbiAgICBjb21waWxlQ2xvc3VyZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBqdW1wTm9kZSA9IEBqdW1wcygpXG4gICAgICAgICAgICBqdW1wTm9kZS5lcnJvciAnY2Fubm90IHVzZSBhIHB1cmUgc3RhdGVtZW50IGluIGFuIGV4cHJlc3Npb24nXG4gICAgICAgIG8uc2hhcmVkU2NvcGUgPSB5ZXNcbiAgICAgICAgZnVuYyA9IG5ldyBDb2RlIFtdLCBCbG9jay53cmFwIFt0aGlzXVxuICAgICAgICBhcmdzID0gW11cbiAgICAgICAgaWYgKGFyZ3VtZW50c05vZGUgPSBAY29udGFpbnMgaXNMaXRlcmFsQXJndW1lbnRzKSBvciBAY29udGFpbnMgaXNMaXRlcmFsVGhpc1xuICAgICAgICAgICAgYXJncyA9IFtuZXcgVGhpc0xpdGVyYWxdXG4gICAgICAgICAgICBpZiBhcmd1bWVudHNOb2RlXG4gICAgICAgICAgICAgICAgbWV0aCA9ICdhcHBseSdcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2ggbmV3IElkZW50aWZpZXJMaXRlcmFsICdhcmd1bWVudHMnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbWV0aCA9ICdjYWxsJ1xuICAgICAgICAgICAgZnVuYyA9IG5ldyBWYWx1ZSBmdW5jLCBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lIG1ldGhdXG4gICAgICAgIHBhcnRzID0gKG5ldyBDYWxsIGZ1bmMsIGFyZ3MpLmNvbXBpbGVOb2RlIG9cbiAgICAgICAgaWYgZnVuYy5pc0dlbmVyYXRvciBvciBmdW5jLmJhc2U/LmlzR2VuZXJhdG9yXG4gICAgICAgICAgICBwYXJ0cy51bnNoaWZ0IEBtYWtlQ29kZSBcIih5aWVsZCogXCJcbiAgICAgICAgICAgIHBhcnRzLnB1c2ggICAgQG1ha2VDb2RlIFwiKVwiXG4gICAgICAgIHBhcnRzXG5cbiAgICAjIElmIHRoZSBjb2RlIGdlbmVyYXRpb24gd2lzaGVzIHRvIHVzZSB0aGUgcmVzdWx0IG9mIGEgY29tcGxleCBleHByZXNzaW9uXG4gICAgIyBpbiBtdWx0aXBsZSBwbGFjZXMsIGVuc3VyZSB0aGF0IHRoZSBleHByZXNzaW9uIGlzIG9ubHkgZXZlciBldmFsdWF0ZWQgb25jZSxcbiAgICAjIGJ5IGFzc2lnbmluZyBpdCB0byBhIHRlbXBvcmFyeSB2YXJpYWJsZS4gUGFzcyBhIGxldmVsIHRvIHByZWNvbXBpbGUuXG4gICAgI1xuICAgICMgSWYgYGxldmVsYCBpcyBwYXNzZWQsIHRoZW4gcmV0dXJucyBgW3ZhbCwgcmVmXWAsIHdoZXJlIGB2YWxgIGlzIHRoZSBjb21waWxlZCB2YWx1ZSwgYW5kIGByZWZgXG4gICAgIyBpcyB0aGUgY29tcGlsZWQgcmVmZXJlbmNlLiBJZiBgbGV2ZWxgIGlzIG5vdCBwYXNzZWQsIHRoaXMgcmV0dXJucyBgW3ZhbCwgcmVmXWAgd2hlcmVcbiAgICAjIHRoZSB0d28gdmFsdWVzIGFyZSByYXcgbm9kZXMgd2hpY2ggaGF2ZSBub3QgYmVlbiBjb21waWxlZC5cbiAgICBcbiAgICBjYWNoZTogKG8sIGxldmVsLCBpc0NvbXBsZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBjb21wbGV4ID0gaWYgaXNDb21wbGV4PyB0aGVuIGlzQ29tcGxleCB0aGlzIGVsc2UgQGlzQ29tcGxleCgpXG4gICAgICAgIGlmIGNvbXBsZXhcbiAgICAgICAgICAgIHJlZiA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ1xuICAgICAgICAgICAgc3ViID0gbmV3IEFzc2lnbiByZWYsIHRoaXNcbiAgICAgICAgICAgIGlmIGxldmVsIHRoZW4gW3N1Yi5jb21waWxlVG9GcmFnbWVudHMobywgbGV2ZWwpLCBbQG1ha2VDb2RlKHJlZi52YWx1ZSldXSBlbHNlIFtzdWIsIHJlZl1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVmID0gaWYgbGV2ZWwgdGhlbiBAY29tcGlsZVRvRnJhZ21lbnRzIG8sIGxldmVsIGVsc2UgdGhpc1xuICAgICAgICAgICAgW3JlZiwgcmVmXVxuXG4gICAgY2FjaGVUb0NvZGVGcmFnbWVudHM6IChjYWNoZVZhbHVlcykgLT5cbiAgICAgICAgXG4gICAgICAgIFtmcmFnbWVudHNUb1RleHQoY2FjaGVWYWx1ZXNbMF0pLCBmcmFnbWVudHNUb1RleHQoY2FjaGVWYWx1ZXNbMV0pXVxuXG4gICAgIyBDb25zdHJ1Y3QgYSBub2RlIHRoYXQgcmV0dXJucyB0aGUgY3VycmVudCBub2RlJ3MgcmVzdWx0LlxuICAgICMgTm90ZSB0aGF0IHRoaXMgaXMgb3ZlcnJpZGRlbiBmb3Igc21hcnRlciBiZWhhdmlvciBmb3JcbiAgICAjIG1hbnkgc3RhdGVtZW50IG5vZGVzIChlLmcuIElmLCBGb3IpLi4uXG4gICAgXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgbWUgPSBAdW53cmFwQWxsKClcbiAgICAgICAgaWYgcmVzXG4gICAgICAgICAgICBuZXcgQ2FsbCBuZXcgTGl0ZXJhbChcIiN7cmVzfS5wdXNoXCIpLCBbbWVdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5ldyBSZXR1cm4gbWVcblxuICAgICMgRG9lcyB0aGlzIG5vZGUsIG9yIGFueSBvZiBpdHMgY2hpbGRyZW4sIGNvbnRhaW4gYSBub2RlIG9mIGEgY2VydGFpbiBraW5kP1xuICAgICMgUmVjdXJzaXZlbHkgdHJhdmVyc2VzIGRvd24gdGhlICpjaGlsZHJlbiogbm9kZXMgYW5kIHJldHVybnMgdGhlIGZpcnN0IG9uZVxuICAgICMgdGhhdCB2ZXJpZmllcyBgcHJlZGAuIE90aGVyd2lzZSByZXR1cm4gdW5kZWZpbmVkLiBgY29udGFpbnNgIGRvZXMgbm90IGNyb3NzXG4gICAgIyBzY29wZSBib3VuZGFyaWVzLlxuICAgIFxuICAgIGNvbnRhaW5zOiAocHJlZCkgLT5cbiAgICAgICAgbm9kZSA9IHVuZGVmaW5lZFxuICAgICAgICBAdHJhdmVyc2VDaGlsZHJlbiBubywgKG4pIC0+XG4gICAgICAgICAgICBpZiBwcmVkIG5cbiAgICAgICAgICAgICAgICBub2RlID0gblxuICAgICAgICAgICAgICAgIHJldHVybiBub1xuICAgICAgICBub2RlXG5cbiAgICBsYXN0Tm9uQ29tbWVudDogKGxpc3QpIC0+ICMgUHVsbCBvdXQgdGhlIGxhc3Qgbm9uLWNvbW1lbnQgbm9kZSBvZiBhIG5vZGUgbGlzdC5cbiAgICAgICAgaSA9IGxpc3QubGVuZ3RoXG4gICAgICAgIHJldHVybiBsaXN0W2ldIHdoaWxlIGktLSB3aGVuIGxpc3RbaV0gbm90IGluc3RhbmNlb2YgQ29tbWVudFxuICAgICAgICBudWxsXG5cbiAgICAjIGB0b1N0cmluZ2AgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5vZGUsIGZvciBpbnNwZWN0aW5nIHRoZSBwYXJzZSB0cmVlLlxuICAgICMgVGhpcyBpcyB3aGF0IGBjb2ZmZWUgLS1ub2Rlc2AgcHJpbnRzIG91dC5cbiAgICBcbiAgICB0b1N0cmluZzogKGlkdCA9ICcnLCBuYW1lID0gQGNvbnN0cnVjdG9yLm5hbWUpIC0+XG4gICAgICAgIHRyZWUgPSAnXFxuJyArIGlkdCArIG5hbWVcbiAgICAgICAgdHJlZSArPSAnPycgaWYgQHNvYWtcbiAgICAgICAgQGVhY2hDaGlsZCAobm9kZSkgLT4gdHJlZSArPSBub2RlLnRvU3RyaW5nIGlkdCArIFRBQlxuICAgICAgICB0cmVlXG5cbiAgICAjIFBhc3NlcyBlYWNoIGNoaWxkIHRvIGEgZnVuY3Rpb24sIGJyZWFraW5nIHdoZW4gdGhlIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYC5cbiAgICBcbiAgICBlYWNoQ2hpbGQ6IChmdW5jKSAtPlxuICAgICAgICByZXR1cm4gdGhpcyB1bmxlc3MgQGNoaWxkcmVuXG4gICAgICAgIGZvciBhdHRyIGluIEBjaGlsZHJlbiB3aGVuIEBbYXR0cl1cbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBmbGF0dGVuIFtAW2F0dHJdXVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzIGlmIGZ1bmMoY2hpbGQpIGlzIGZhbHNlXG4gICAgICAgIHRoaXNcblxuICAgIHRyYXZlcnNlQ2hpbGRyZW46IChjcm9zc1Njb3BlLCBmdW5jKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVhY2hDaGlsZCAoY2hpbGQpIC0+XG4gICAgICAgICAgICByZWN1ciA9IGZ1bmMoY2hpbGQpXG4gICAgICAgICAgICBjaGlsZC50cmF2ZXJzZUNoaWxkcmVuKGNyb3NzU2NvcGUsIGZ1bmMpIHVubGVzcyByZWN1ciBpcyBub1xuXG4gICAgaW52ZXJ0OiAtPlxuICAgICAgICBuZXcgT3AgJyEnLCB0aGlzXG5cbiAgICB1bndyYXBBbGw6IC0+XG4gICAgICAgIG5vZGUgPSB0aGlzXG4gICAgICAgIGNvbnRpbnVlIHVudGlsIG5vZGUgaXMgbm9kZSA9IG5vZGUudW53cmFwKClcbiAgICAgICAgbm9kZVxuXG4gICAgIyBEZWZhdWx0IGltcGxlbWVudGF0aW9ucyBvZiB0aGUgY29tbW9uIG5vZGUgcHJvcGVydGllcyBhbmQgbWV0aG9kcy4gTm9kZXNcbiAgICAjIHdpbGwgb3ZlcnJpZGUgdGhlc2Ugd2l0aCBjdXN0b20gbG9naWMsIGlmIG5lZWRlZC5cbiAgICBcbiAgICBjaGlsZHJlbjogICAgIFtdXG4gICAgaXNTdGF0ZW1lbnQ6ICBOT1xuICAgIGp1bXBzOiAgICAgICAgTk9cbiAgICBpc0NvbXBsZXg6ICAgIFlFU1xuICAgIGlzQ2hhaW5hYmxlOiAgTk9cbiAgICBpc0Fzc2lnbmFibGU6IE5PXG4gICAgaXNOdW1iZXI6ICAgICBOT1xuICAgIHVud3JhcDogICAgICAgVEhJU1xuICAgIHVuZm9sZFNvYWs6ICAgTk9cblxuICAgIGFzc2lnbnM6ICAgICAgTk8gIyBJcyB0aGlzIG5vZGUgdXNlZCB0byBhc3NpZ24gYSBjZXJ0YWluIHZhcmlhYmxlP1xuXG4gICAgIyBGb3IgdGhpcyBub2RlIGFuZCBhbGwgZGVzY2VuZGVudHMsIHNldCB0aGUgbG9jYXRpb24gZGF0YSB0byBgbG9jYXRpb25EYXRhYFxuICAgICMgaWYgdGhlIGxvY2F0aW9uIGRhdGEgaXMgbm90IGFscmVhZHkgc2V0LlxuICAgIFxuICAgIHVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZzogKGxvY2F0aW9uRGF0YSkgLT5cbiAgICAgICAgcmV0dXJuIHRoaXMgaWYgQGxvY2F0aW9uRGF0YVxuICAgICAgICBAbG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhXG5cbiAgICAgICAgQGVhY2hDaGlsZCAoY2hpbGQpIC0+XG4gICAgICAgICAgICBjaGlsZC51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgbG9jYXRpb25EYXRhXG5cbiAgICBlcnJvcjogKG1lc3NhZ2UpIC0+ICMgVGhyb3cgYSBTeW50YXhFcnJvciBhc3NvY2lhdGVkIHdpdGggdGhpcyBub2RlJ3MgbG9jYXRpb24uXG4gICAgICAgIFxuICAgICAgICB0aHJvd1N5bnRheEVycm9yIG1lc3NhZ2UsIEBsb2NhdGlvbkRhdGFcblxuICAgIG1ha2VDb2RlOiAoY29kZSkgLT5cbiAgICAgICAgbmV3IENvZGVGcmFnbWVudCB0aGlzLCBjb2RlXG5cbiAgICB3cmFwSW5CcmFjZXM6IChmcmFnbWVudHMpIC0+XG4gICAgICAgIFtdLmNvbmNhdCBAbWFrZUNvZGUoJygnKSwgZnJhZ21lbnRzLCBAbWFrZUNvZGUoJyknKVxuXG4gICAgIyBgZnJhZ21lbnRzTGlzdGAgaXMgYW4gYXJyYXkgb2YgYXJyYXlzIG9mIGZyYWdtZW50cy4gRWFjaCBhcnJheSBpbiBmcmFnbWVudHNMaXN0IHdpbGwgYmVcbiAgICAjIGNvbmNhdG9uYXRlZCB0b2dldGhlciwgd2l0aCBgam9pblN0cmAgYWRkZWQgaW4gYmV0d2VlbiBlYWNoLCB0byBwcm9kdWNlIGEgZmluYWwgZmxhdCBhcnJheVxuICAgICMgb2YgZnJhZ21lbnRzLlxuICAgIFxuICAgIGpvaW5GcmFnbWVudEFycmF5czogKGZyYWdtZW50c0xpc3QsIGpvaW5TdHIpIC0+XG4gICAgICAgIGFuc3dlciA9IFtdXG4gICAgICAgIGZvciBmcmFnbWVudHMsaSBpbiBmcmFnbWVudHNMaXN0XG4gICAgICAgICAgICBpZiBpIHRoZW4gYW5zd2VyLnB1c2ggQG1ha2VDb2RlIGpvaW5TdHJcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgZnJhZ21lbnRzXG4gICAgICAgIGFuc3dlclxuXG4jIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFRoZSBibG9jayBpcyB0aGUgbGlzdCBvZiBleHByZXNzaW9ucyB0aGF0IGZvcm1zIHRoZSBib2R5IG9mIGFuXG4jIGluZGVudGVkIGJsb2NrIG9mIGNvZGUgLS0gdGhlIGltcGxlbWVudGF0aW9uIG9mIGEgZnVuY3Rpb24sIGEgY2xhdXNlIGluIGFuXG4jIGBpZmAsIGBzd2l0Y2hgLCBvciBgdHJ5YCwgYW5kIHNvIG9uLi4uXG5cbmV4cG9ydHMuQmxvY2sgPSBjbGFzcyBCbG9jayBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKG5vZGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgQGV4cHJlc3Npb25zID0gY29tcGFjdCBmbGF0dGVuIG5vZGVzIG9yIFtdXG5cbiAgICBjaGlsZHJlbjogWydleHByZXNzaW9ucyddXG5cbiAgICBwdXNoOiAobm9kZSkgLT4gIyBUYWNrIGFuIGV4cHJlc3Npb24gb24gdG8gdGhlIGVuZCBvZiB0aGlzIGV4cHJlc3Npb24gbGlzdC5cbiAgICAgICAgXG4gICAgICAgIEBleHByZXNzaW9ucy5wdXNoIG5vZGVcbiAgICAgICAgdGhpc1xuXG4gICAgcG9wOiAtPiAjIFJlbW92ZSBhbmQgcmV0dXJuIHRoZSBsYXN0IGV4cHJlc3Npb24gb2YgdGhpcyBleHByZXNzaW9uIGxpc3QuXG4gICAgICAgIFxuICAgICAgICBAZXhwcmVzc2lvbnMucG9wKClcblxuICAgIHVuc2hpZnQ6IChub2RlKSAtPiAjIEFkZCBhbiBleHByZXNzaW9uIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhpcyBleHByZXNzaW9uIGxpc3QuXG4gICAgICAgIFxuICAgICAgICBAZXhwcmVzc2lvbnMudW5zaGlmdCBub2RlXG4gICAgICAgIHRoaXNcblxuICAgICMgSWYgdGhpcyBCbG9jayBjb25zaXN0cyBvZiBqdXN0IGEgc2luZ2xlIG5vZGUsIHVud3JhcCBpdCBieSBwdWxsaW5nIGl0IGJhY2sgb3V0LlxuICAgIFxuICAgIHVud3JhcDogLT5cbiAgICAgICAgaWYgQGV4cHJlc3Npb25zLmxlbmd0aCBpcyAxIHRoZW4gQGV4cHJlc3Npb25zWzBdIGVsc2UgdGhpc1xuXG4gICAgaXNFbXB0eTogLT4gIyBJcyB0aGlzIGFuIGVtcHR5IGJsb2NrIG9mIGNvZGU/XG4gICAgICAgIG5vdCBAZXhwcmVzc2lvbnMubGVuZ3RoXG5cbiAgICBpc1N0YXRlbWVudDogKG8pIC0+XG4gICAgICAgIGZvciBleHAgaW4gQGV4cHJlc3Npb25zIHdoZW4gZXhwLmlzU3RhdGVtZW50IG9cbiAgICAgICAgICAgIHJldHVybiB5ZXNcbiAgICAgICAgbm9cblxuICAgIGp1bXBzOiAobykgLT5cbiAgICAgICAgZm9yIGV4cCBpbiBAZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIHJldHVybiBqdW1wTm9kZSBpZiBqdW1wTm9kZSA9IGV4cC5qdW1wcyBvXG5cbiAgICAjIEEgQmxvY2sgbm9kZSBkb2VzIG5vdCByZXR1cm4gaXRzIGVudGlyZSBib2R5LCByYXRoZXIgaXRcbiAgICAjIGVuc3VyZXMgdGhhdCB0aGUgZmluYWwgZXhwcmVzc2lvbiBpcyByZXR1cm5lZC5cbiAgICBcbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgbGVuID0gQGV4cHJlc3Npb25zLmxlbmd0aFxuICAgICAgICB3aGlsZSBsZW4tLVxuICAgICAgICAgICAgZXhwciA9IEBleHByZXNzaW9uc1tsZW5dXG4gICAgICAgICAgICBpZiBleHByIG5vdCBpbnN0YW5jZW9mIENvbW1lbnRcbiAgICAgICAgICAgICAgICBAZXhwcmVzc2lvbnNbbGVuXSA9IGV4cHIubWFrZVJldHVybiByZXNcbiAgICAgICAgICAgICAgICBAZXhwcmVzc2lvbnMuc3BsaWNlKGxlbiwgMSkgaWYgZXhwciBpbnN0YW5jZW9mIFJldHVybiBhbmQgbm90IGV4cHIuZXhwcmVzc2lvblxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIHRoaXNcblxuICAgICMgQSAqKkJsb2NrKiogaXMgdGhlIG9ubHkgbm9kZSB0aGF0IGNhbiBzZXJ2ZSBhcyB0aGUgcm9vdC5cbiAgICBcbiAgICBjb21waWxlVG9GcmFnbWVudHM6IChvID0ge30sIGxldmVsKSAtPlxuICAgICAgICBpZiBvLnNjb3BlIHRoZW4gc3VwZXIgbywgbGV2ZWwgZWxzZSBAY29tcGlsZVJvb3Qgb1xuXG4gICAgIyBDb21waWxlIGFsbCBleHByZXNzaW9ucyB3aXRoaW4gdGhlICoqQmxvY2sqKiBib2R5LiBJZiB3ZSBuZWVkIHRvXG4gICAgIyByZXR1cm4gdGhlIHJlc3VsdCwgYW5kIGl0J3MgYW4gZXhwcmVzc2lvbiwgc2ltcGx5IHJldHVybiBpdC4gSWYgaXQncyBhXG4gICAgIyBzdGF0ZW1lbnQsIGFzayB0aGUgc3RhdGVtZW50IHRvIGRvIHNvLlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIEB0YWIgICAgPSBvLmluZGVudFxuICAgICAgICB0b3AgICAgID0gby5sZXZlbCBpcyBMRVZFTF9UT1BcbiAgICAgICAgY29tcGlsZWROb2RlcyA9IFtdXG5cbiAgICAgICAgZm9yIG5vZGUsIGluZGV4IGluIEBleHByZXNzaW9uc1xuXG4gICAgICAgICAgICBub2RlID0gbm9kZS51bndyYXBBbGwoKVxuICAgICAgICAgICAgbm9kZSA9IChub2RlLnVuZm9sZFNvYWsobykgb3Igbm9kZSlcbiAgICAgICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICAgICAgICAgICMgVGhpcyBpcyBhIG5lc3RlZCBibG9jay4gV2UgZG9uJ3QgZG8gYW55dGhpbmcgc3BlY2lhbCBoZXJlIGxpa2UgZW5jbG9zZVxuICAgICAgICAgICAgICAgICMgaXQgaW4gYSBuZXcgc2NvcGU7IHdlIGp1c3QgY29tcGlsZSB0aGUgc3RhdGVtZW50cyBpbiB0aGlzIGJsb2NrIGFsb25nIHdpdGggb3VyIG93blxuICAgICAgICAgICAgICAgIGNvbXBpbGVkTm9kZXMucHVzaCBub2RlLmNvbXBpbGVOb2RlIG9cbiAgICAgICAgICAgIGVsc2UgaWYgdG9wXG4gICAgICAgICAgICAgICAgbm9kZS5mcm9udCA9IHRydWVcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMgPSBub2RlLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgICAgICAgICAgdW5sZXNzIG5vZGUuaXNTdGF0ZW1lbnQgb1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMudW5zaGlmdCBAbWFrZUNvZGUgXCIje0B0YWJ9XCJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIFwiO1wiXG4gICAgICAgICAgICAgICAgY29tcGlsZWROb2Rlcy5wdXNoIGZyYWdtZW50c1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNvbXBpbGVkTm9kZXMucHVzaCBub2RlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIGlmIHRvcFxuICAgICAgICAgICAgaWYgQHNwYWNlZFxuICAgICAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgQGpvaW5GcmFnbWVudEFycmF5cyhjb21waWxlZE5vZGVzLCAnXFxuXFxuJyksIEBtYWtlQ29kZShcIlxcblwiKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBAam9pbkZyYWdtZW50QXJyYXlzKGNvbXBpbGVkTm9kZXMsICdcXG4nKVxuICAgICAgICBpZiBjb21waWxlZE5vZGVzLmxlbmd0aFxuICAgICAgICAgICAgYW5zd2VyID0gQGpvaW5GcmFnbWVudEFycmF5cyhjb21waWxlZE5vZGVzLCAnLCAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhbnN3ZXIgPSBbQG1ha2VDb2RlIFwidm9pZCAwXCJdXG4gICAgICAgIGlmIGNvbXBpbGVkTm9kZXMubGVuZ3RoID4gMSBhbmQgby5sZXZlbCA+PSBMRVZFTF9MSVNUIHRoZW4gQHdyYXBJbkJyYWNlcyBhbnN3ZXIgZWxzZSBhbnN3ZXJcblxuICAgICMgSWYgd2UgaGFwcGVuIHRvIGJlIHRoZSB0b3AtbGV2ZWwgKipCbG9jayoqLCB3cmFwIGV2ZXJ5dGhpbmcgaW5cbiAgICAjIGEgc2FmZXR5IGNsb3N1cmUsIHVubGVzcyByZXF1ZXN0ZWQgbm90IHRvLlxuICAgICMgSXQgd291bGQgYmUgYmV0dGVyIG5vdCB0byBnZW5lcmF0ZSB0aGVtIGluIHRoZSBmaXJzdCBwbGFjZSwgYnV0IGZvciBub3csXG4gICAgIyBjbGVhbiB1cCBvYnZpb3VzIGRvdWJsZS1wYXJlbnRoZXNlcy5cbiAgICBcbiAgICBjb21waWxlUm9vdDogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBvLmluZGVudCA9IGlmIG8uYmFyZSB0aGVuICcnIGVsc2UgVEFCXG4gICAgICAgIG8ubGV2ZWwgID0gTEVWRUxfVE9QXG4gICAgICAgIEBzcGFjZWQgID0geWVzXG4gICAgICAgIG8uc2NvcGUgID0gbmV3IFNjb3BlIG51bGwsIHRoaXMsIG51bGwsIG8ucmVmZXJlbmNlZFZhcnMgPyBbXVxuICAgICAgICBcbiAgICAgICAgIyBNYXJrIGdpdmVuIGxvY2FsIHZhcmlhYmxlcyBpbiB0aGUgcm9vdCBzY29wZSBhcyBwYXJhbWV0ZXJzIHNvIHRoZXkgZG9uJ3QgZW5kIHVwIGJlaW5nIGRlY2xhcmVkIG9uIHRoaXMgYmxvY2suXG4gICAgICAgIFxuICAgICAgICBvLnNjb3BlLnBhcmFtZXRlciBuYW1lIGZvciBuYW1lIGluIG8ubG9jYWxzIG9yIFtdXG4gICAgICAgIHByZWx1ZGUgPSBbXVxuICAgICAgICBpZiBub3Qgby5iYXJlXG4gICAgICAgICAgICBwcmVsdWRlRXhwcyA9IGZvciBleHAsIGkgaW4gQGV4cHJlc3Npb25zXG4gICAgICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGV4cC51bndyYXAoKSBpbnN0YW5jZW9mIENvbW1lbnRcbiAgICAgICAgICAgICAgICBleHBcbiAgICAgICAgICAgIHJlc3QgPSBAZXhwcmVzc2lvbnNbcHJlbHVkZUV4cHMubGVuZ3RoLi4uXVxuICAgICAgICAgICAgQGV4cHJlc3Npb25zID0gcHJlbHVkZUV4cHNcbiAgICAgICAgICAgIGlmIHByZWx1ZGVFeHBzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHByZWx1ZGUgPSBAY29tcGlsZU5vZGUgbWVyZ2UobywgaW5kZW50OiAnJylcbiAgICAgICAgICAgICAgICBwcmVsdWRlLnB1c2ggQG1ha2VDb2RlIFwiXFxuXCJcbiAgICAgICAgICAgIEBleHByZXNzaW9ucyA9IHJlc3RcbiAgICAgICAgZnJhZ21lbnRzID0gQGNvbXBpbGVXaXRoRGVjbGFyYXRpb25zIG9cbiAgICAgICAgcmV0dXJuIGZyYWdtZW50cyBpZiBvLmJhcmVcbiAgICAgICAgW10uY29uY2F0IHByZWx1ZGUsIEBtYWtlQ29kZShcIihmdW5jdGlvbigpIHtcXG5cIiksIGZyYWdtZW50cywgQG1ha2VDb2RlKFwiXFxufSkuY2FsbCh0aGlzKTtcXG5cIilcblxuICAgICMgQ29tcGlsZSB0aGUgZXhwcmVzc2lvbnMgYm9keSBmb3IgdGhlIGNvbnRlbnRzIG9mIGEgZnVuY3Rpb24sIHdpdGhcbiAgICAjIGRlY2xhcmF0aW9ucyBvZiBhbGwgaW5uZXIgdmFyaWFibGVzIHB1c2hlZCB1cCB0byB0aGUgdG9wLlxuICAgIFxuICAgIGNvbXBpbGVXaXRoRGVjbGFyYXRpb25zOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIGZyYWdtZW50cyA9IFtdXG4gICAgICAgIHBvc3QgPSBbXVxuICAgICAgICBmb3IgZXhwLCBpIGluIEBleHByZXNzaW9uc1xuICAgICAgICAgICAgZXhwID0gZXhwLnVud3JhcCgpXG4gICAgICAgICAgICBicmVhayB1bmxlc3MgZXhwIGluc3RhbmNlb2YgQ29tbWVudCBvciBleHAgaW5zdGFuY2VvZiBMaXRlcmFsXG4gICAgICAgIG8gPSBtZXJnZShvLCBsZXZlbDogTEVWRUxfVE9QKVxuICAgICAgICBpZiBpXG4gICAgICAgICAgICByZXN0ID0gQGV4cHJlc3Npb25zLnNwbGljZSBpLCA5ZTlcbiAgICAgICAgICAgIFtzcGFjZWQsICAgICAgICBAc3BhY2VkXSA9IFtAc3BhY2VkLCBub11cbiAgICAgICAgICAgIFtmcmFnbWVudHMsIEBzcGFjZWRdID0gW0Bjb21waWxlTm9kZShvKSwgc3BhY2VkXVxuICAgICAgICAgICAgQGV4cHJlc3Npb25zID0gcmVzdFxuICAgICAgICBwb3N0ID0gQGNvbXBpbGVOb2RlIG9cbiAgICAgICAge3Njb3BlfSA9IG9cbiAgICAgICAgaWYgc2NvcGUuZXhwcmVzc2lvbnMgaXMgdGhpc1xuICAgICAgICAgICAgZGVjbGFycyA9IG8uc2NvcGUuaGFzRGVjbGFyYXRpb25zKClcbiAgICAgICAgICAgIGFzc2lnbnMgPSBzY29wZS5oYXNBc3NpZ25tZW50c1xuICAgICAgICAgICAgaWYgZGVjbGFycyBvciBhc3NpZ25zXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdcXG4nIGlmIGlcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIje0B0YWJ9dmFyIFwiXG4gICAgICAgICAgICAgICAgaWYgZGVjbGFyc1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgc2NvcGUuZGVjbGFyZWRWYXJpYWJsZXMoKS5qb2luKCcsICcpXG4gICAgICAgICAgICAgICAgaWYgYXNzaWduc1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIsXFxuI3tAdGFiICsgVEFCfVwiIGlmIGRlY2xhcnNcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIHNjb3BlLmFzc2lnbmVkVmFyaWFibGVzKCkuam9pbihcIixcXG4je0B0YWIgKyBUQUJ9XCIpXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIFwiO1xcbiN7aWYgQHNwYWNlZCB0aGVuICdcXG4nIGVsc2UgJyd9XCJcbiAgICAgICAgICAgIGVsc2UgaWYgZnJhZ21lbnRzLmxlbmd0aCBhbmQgcG9zdC5sZW5ndGhcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCJcXG5cIlxuICAgICAgICBmcmFnbWVudHMuY29uY2F0IHBvc3RcblxuICAgICMgV3JhcCB1cCB0aGUgZ2l2ZW4gbm9kZXMgYXMgYSAqKkJsb2NrKiosIHVubGVzcyBpdCBhbHJlYWR5IGhhcHBlbnMgdG8gYmUgb25lLlxuICAgIFxuICAgIEB3cmFwOiAobm9kZXMpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbm9kZXNbMF0gaWYgbm9kZXMubGVuZ3RoIGlzIDEgYW5kIG5vZGVzWzBdIGluc3RhbmNlb2YgQmxvY2tcbiAgICAgICAgbmV3IEJsb2NrIG5vZGVzXG5cbiMgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgXG4jIDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICBcbiMgMDAwICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgXG4jIDAwMDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuXG4jIGBMaXRlcmFsYCBpcyBhIGJhc2UgY2xhc3MgZm9yIHN0YXRpYyB2YWx1ZXMgdGhhdCBjYW4gYmUgcGFzc2VkIHRocm91Z2hcbiMgZGlyZWN0bHkgaW50byBKYXZhU2NyaXB0IHdpdGhvdXQgdHJhbnNsYXRpb24sIHN1Y2ggYXM6IHN0cmluZ3MsIG51bWJlcnMsIGB0cnVlYCwgYGZhbHNlYCwgYG51bGxgLi4uXG5cbmV4cG9ydHMuTGl0ZXJhbCA9IGNsYXNzIExpdGVyYWwgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAdmFsdWUpIC0+XG5cbiAgICBpc0NvbXBsZXg6IE5PXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgbmFtZSBpcyBAdmFsdWVcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgW0BtYWtlQ29kZSBAdmFsdWVdXG5cbiAgICB0b1N0cmluZzogLT5cbiAgICAgICAgXCIgI3tpZiBAaXNTdGF0ZW1lbnQoKSB0aGVuIHN1cGVyIGVsc2UgQGNvbnN0cnVjdG9yLm5hbWV9OiAje0B2YWx1ZX1cIlxuXG5leHBvcnRzLk51bWJlckxpdGVyYWwgPSBjbGFzcyBOdW1iZXJMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG5leHBvcnRzLkluZmluaXR5TGl0ZXJhbCA9IGNsYXNzIEluZmluaXR5TGl0ZXJhbCBleHRlbmRzIE51bWJlckxpdGVyYWxcbiAgICBjb21waWxlTm9kZTogLT5cbiAgICAgICAgW0BtYWtlQ29kZSAnMmUzMDgnXVxuXG5leHBvcnRzLk5hTkxpdGVyYWwgPSBjbGFzcyBOYU5MaXRlcmFsIGV4dGVuZHMgTnVtYmVyTGl0ZXJhbFxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBzdXBlciAnTmFOJ1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBjb2RlID0gW0BtYWtlQ29kZSAnMC8wJ11cbiAgICAgICAgaWYgby5sZXZlbCA+PSBMRVZFTF9PUCB0aGVuIEB3cmFwSW5CcmFjZXMgY29kZSBlbHNlIGNvZGVcblxuZXhwb3J0cy5TdHJpbmdMaXRlcmFsID0gY2xhc3MgU3RyaW5nTGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcblxuZXhwb3J0cy5SZWdleExpdGVyYWwgPSBjbGFzcyBSZWdleExpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG5cbmV4cG9ydHMuUGFzc3Rocm91Z2hMaXRlcmFsID0gY2xhc3MgUGFzc3Rocm91Z2hMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuXG5leHBvcnRzLklkZW50aWZpZXJMaXRlcmFsID0gY2xhc3MgSWRlbnRpZmllckxpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG4gICAgaXNBc3NpZ25hYmxlOiBZRVNcblxuZXhwb3J0cy5Qcm9wZXJ0eU5hbWUgPSBjbGFzcyBQcm9wZXJ0eU5hbWUgZXh0ZW5kcyBMaXRlcmFsXG4gICAgaXNBc3NpZ25hYmxlOiBZRVNcblxuZXhwb3J0cy5TdGF0ZW1lbnRMaXRlcmFsID0gY2xhc3MgU3RhdGVtZW50TGl0ZXJhbCBleHRlbmRzIExpdGVyYWxcbiAgICBpc1N0YXRlbWVudDogWUVTXG5cbiAgICBtYWtlUmV0dXJuOiBUSElTXG5cbiAgICBqdW1wczogKG8pIC0+XG4gICAgICAgIHJldHVybiB0aGlzIGlmIEB2YWx1ZSBpcyAnYnJlYWsnIGFuZCBub3QgKG8/Lmxvb3Agb3Igbz8uYmxvY2spXG4gICAgICAgIHJldHVybiB0aGlzIGlmIEB2YWx1ZSBpcyAnY29udGludWUnIGFuZCBub3Qgbz8ubG9vcFxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBbQG1ha2VDb2RlIFwiI3tAdGFifSN7QHZhbHVlfTtcIl1cblxuZXhwb3J0cy5UaGlzTGl0ZXJhbCA9IGNsYXNzIFRoaXNMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBzdXBlciAndGhpcydcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgY29kZSA9IGlmIG8uc2NvcGUubWV0aG9kPy5ib3VuZCB0aGVuIG8uc2NvcGUubWV0aG9kLmNvbnRleHQgZWxzZSBAdmFsdWVcbiAgICAgICAgW0BtYWtlQ29kZSBjb2RlXVxuXG5leHBvcnRzLlVuZGVmaW5lZExpdGVyYWwgPSBjbGFzcyBVbmRlZmluZWRMaXRlcmFsIGV4dGVuZHMgTGl0ZXJhbFxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBzdXBlciAndW5kZWZpbmVkJ1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBbQG1ha2VDb2RlIGlmIG8ubGV2ZWwgPj0gTEVWRUxfQUNDRVNTIHRoZW4gJyh2b2lkIDApJyBlbHNlICd2b2lkIDAnXVxuXG5leHBvcnRzLk51bGxMaXRlcmFsID0gY2xhc3MgTnVsbExpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIHN1cGVyICdudWxsJ1xuXG5leHBvcnRzLkJvb2xlYW5MaXRlcmFsID0gY2xhc3MgQm9vbGVhbkxpdGVyYWwgZXh0ZW5kcyBMaXRlcmFsXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcblxuIyBBIGByZXR1cm5gIGlzIGEgKnB1cmVTdGF0ZW1lbnQqIC0tIHdyYXBwaW5nIGl0IGluIGEgY2xvc3VyZSB3b3VsZG4ndCBtYWtlIHNlbnNlLlxuXG5leHBvcnRzLlJldHVybiA9IGNsYXNzIFJldHVybiBleHRlbmRzIEJhc2VcbiAgICBjb25zdHJ1Y3RvcjogKEBleHByZXNzaW9uKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnZXhwcmVzc2lvbiddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG4gICAgbWFrZVJldHVybjogIFRISVNcbiAgICBqdW1wczogICAgICAgVEhJU1xuXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobywgbGV2ZWwpIC0+XG4gICAgICAgIGV4cHIgPSBAZXhwcmVzc2lvbj8ubWFrZVJldHVybigpXG4gICAgICAgIGlmIGV4cHIgYW5kIGV4cHIgbm90IGluc3RhbmNlb2YgUmV0dXJuIHRoZW4gZXhwci5jb21waWxlVG9GcmFnbWVudHMgbywgbGV2ZWwgZWxzZSBzdXBlciBvLCBsZXZlbFxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICAjIFRPRE86IElmIHdlIGNhbGwgZXhwcmVzc2lvbi5jb21waWxlKCkgaGVyZSB0d2ljZSwgd2UnbGwgc29tZXRpbWVzIGdldCBiYWNrIGRpZmZlcmVudCByZXN1bHRzIVxuICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgQHRhYiArIFwicmV0dXJuI3tpZiBAZXhwcmVzc2lvbiB0aGVuIFwiIFwiIGVsc2UgXCJcIn1cIlxuICAgICAgICBpZiBAZXhwcmVzc2lvblxuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAZXhwcmVzc2lvbi5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfUEFSRU5cbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiO1wiXG4gICAgICAgIHJldHVybiBhbnN3ZXJcblxuIyBgeWllbGQgcmV0dXJuYCB3b3JrcyBleGFjdGx5IGxpa2UgYHJldHVybmAsIGV4Y2VwdCB0aGF0IGl0IHR1cm5zIHRoZSBmdW5jdGlvbiBpbnRvIGEgZ2VuZXJhdG9yLlxuXG5leHBvcnRzLllpZWxkUmV0dXJuID0gY2xhc3MgWWllbGRSZXR1cm4gZXh0ZW5kcyBSZXR1cm5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIHVubGVzcyBvLnNjb3BlLnBhcmVudD9cbiAgICAgICAgICAgIEBlcnJvciAneWllbGQgY2FuIG9ubHkgb2NjdXIgaW5zaWRlIGZ1bmN0aW9ucydcbiAgICAgICAgc3VwZXJcblxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgIDAwMCAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jICAgICAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcblxuIyBBIHZhbHVlLCB2YXJpYWJsZSBvciBsaXRlcmFsIG9yIHBhcmVudGhlc2l6ZWQsIGluZGV4ZWQgb3IgZG90dGVkIGludG8sIG9yIHZhbmlsbGEuXG5cbmV4cG9ydHMuVmFsdWUgPSBjbGFzcyBWYWx1ZSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKGJhc2UsIHByb3BzLCB0YWcpIC0+XG4gICAgICAgIHJldHVybiBiYXNlIGlmIG5vdCBwcm9wcyBhbmQgYmFzZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgIEBiYXNlICAgICAgID0gYmFzZVxuICAgICAgICBAcHJvcGVydGllcyA9IHByb3BzIG9yIFtdXG4gICAgICAgIEBbdGFnXSAgICAgID0gdHJ1ZSBpZiB0YWdcbiAgICAgICAgcmV0dXJuIHRoaXNcblxuICAgIGNoaWxkcmVuOiBbJ2Jhc2UnLCAncHJvcGVydGllcyddXG5cbiAgICAjIEFkZCBhIHByb3BlcnR5IChvciAqcHJvcGVydGllcyogKSBgQWNjZXNzYCB0byB0aGUgbGlzdC5cbiAgICBhZGQ6IChwcm9wcykgLT5cbiAgICAgICAgQHByb3BlcnRpZXMgPSBAcHJvcGVydGllcy5jb25jYXQgcHJvcHNcbiAgICAgICAgdGhpc1xuXG4gICAgaGFzUHJvcGVydGllczogLT5cbiAgICAgICAgISFAcHJvcGVydGllcy5sZW5ndGhcblxuICAgIGJhcmVMaXRlcmFsOiAodHlwZSkgLT5cbiAgICAgICAgbm90IEBwcm9wZXJ0aWVzLmxlbmd0aCBhbmQgQGJhc2UgaW5zdGFuY2VvZiB0eXBlXG5cbiAgICAjIFNvbWUgYm9vbGVhbiBjaGVja3MgZm9yIHRoZSBiZW5lZml0IG9mIG90aGVyIG5vZGVzLlxuICAgIGlzQXJyYXk6ICAgICAgLT4gQGJhcmVMaXRlcmFsKEFycilcbiAgICBpc1JhbmdlOiAgICAgIC0+IEBiYXJlTGl0ZXJhbChSYW5nZSlcbiAgICBpc0NvbXBsZXg6ICAgIC0+IEBoYXNQcm9wZXJ0aWVzKCkgb3IgQGJhc2UuaXNDb21wbGV4KClcbiAgICBpc0Fzc2lnbmFibGU6IC0+IEBoYXNQcm9wZXJ0aWVzKCkgb3IgQGJhc2UuaXNBc3NpZ25hYmxlKClcbiAgICBpc051bWJlcjogICAgIC0+IEBiYXJlTGl0ZXJhbChOdW1iZXJMaXRlcmFsKVxuICAgIGlzU3RyaW5nOiAgICAgLT4gQGJhcmVMaXRlcmFsKFN0cmluZ0xpdGVyYWwpXG4gICAgaXNSZWdleDogICAgICAtPiBAYmFyZUxpdGVyYWwoUmVnZXhMaXRlcmFsKVxuICAgIGlzVW5kZWZpbmVkOiAgLT4gQGJhcmVMaXRlcmFsKFVuZGVmaW5lZExpdGVyYWwpXG4gICAgaXNOdWxsOiAgICAgICAtPiBAYmFyZUxpdGVyYWwoTnVsbExpdGVyYWwpXG4gICAgaXNCb29sZWFuOiAgICAtPiBAYmFyZUxpdGVyYWwoQm9vbGVhbkxpdGVyYWwpXG4gICAgaXNBdG9taWM6ICAgICAtPlxuICAgICAgICBmb3Igbm9kZSBpbiBAcHJvcGVydGllcy5jb25jYXQgQGJhc2VcbiAgICAgICAgICAgIHJldHVybiBubyBpZiBub2RlLnNvYWsgb3Igbm9kZSBpbnN0YW5jZW9mIENhbGxcbiAgICAgICAgeWVzXG5cbiAgICBpc05vdENhbGxhYmxlOiAtPiBAaXNOdW1iZXIoKSBvciBAaXNTdHJpbmcoKSBvciBAaXNSZWdleCgpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGlzQXJyYXkoKSBvciBAaXNSYW5nZSgpIG9yIEBpc1NwbGljZSgpIG9yIEBpc09iamVjdCgpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGlzVW5kZWZpbmVkKCkgb3IgQGlzTnVsbCgpIG9yIEBpc0Jvb2xlYW4oKVxuXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAgICAtPiBub3QgQHByb3BlcnRpZXMubGVuZ3RoIGFuZCBAYmFzZS5pc1N0YXRlbWVudCBvXG4gICAgYXNzaWduczogICAgIChuYW1lKSAtPiBub3QgQHByb3BlcnRpZXMubGVuZ3RoIGFuZCBAYmFzZS5hc3NpZ25zIG5hbWVcbiAgICBqdW1wczogICAgICAgKG8pICAgIC0+IG5vdCBAcHJvcGVydGllcy5sZW5ndGggYW5kIEBiYXNlLmp1bXBzIG9cblxuICAgIGlzT2JqZWN0OiAob25seUdlbmVyYXRlZCkgLT5cbiAgICAgICAgcmV0dXJuIG5vIGlmIEBwcm9wZXJ0aWVzLmxlbmd0aFxuICAgICAgICAoQGJhc2UgaW5zdGFuY2VvZiBPYmopIGFuZCAobm90IG9ubHlHZW5lcmF0ZWQgb3IgQGJhc2UuZ2VuZXJhdGVkKVxuXG4gICAgaXNTcGxpY2U6IC0+XG4gICAgICAgIFsuLi4sIGxhc3RQcm9wXSA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGxhc3RQcm9wIGluc3RhbmNlb2YgU2xpY2VcblxuICAgIGxvb2tzU3RhdGljOiAoY2xhc3NOYW1lKSAtPlxuICAgICAgICBAYmFzZS52YWx1ZSBpcyBjbGFzc05hbWUgYW5kIEBwcm9wZXJ0aWVzLmxlbmd0aCBpcyAxIGFuZFxuICAgICAgICAgICAgQHByb3BlcnRpZXNbMF0ubmFtZT8udmFsdWUgIT0gJ3Byb3RvdHlwZSdcblxuICAgICMgVGhlIHZhbHVlIGNhbiBiZSB1bndyYXBwZWQgYXMgaXRzIGlubmVyIG5vZGUsIGlmIHRoZXJlIGFyZSBubyBhdHRhY2hlZCBwcm9wZXJ0aWVzLlxuICAgIHVud3JhcDogLT5cbiAgICAgICAgaWYgQHByb3BlcnRpZXMubGVuZ3RoIHRoZW4gdGhpcyBlbHNlIEBiYXNlXG5cbiAgICAjIEEgcmVmZXJlbmNlIGhhcyBiYXNlIHBhcnQgKGB0aGlzYCB2YWx1ZSkgYW5kIG5hbWUgcGFydC5cbiAgICAjIFdlIGNhY2hlIHRoZW0gc2VwYXJhdGVseSBmb3IgY29tcGlsaW5nIGNvbXBsZXggZXhwcmVzc2lvbnMuXG4gICAgIyBgYSgpW2IoKV0gPz0gY2AgLT4gYChfYmFzZSA9IGEoKSlbX25hbWUgPSBiKCldID8gX2Jhc2VbX25hbWVdID0gY2BcbiAgICBcbiAgICBjYWNoZVJlZmVyZW5jZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBbLi4uLCBuYW1lXSA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIEBwcm9wZXJ0aWVzLmxlbmd0aCA8IDIgYW5kIG5vdCBAYmFzZS5pc0NvbXBsZXgoKSBhbmQgbm90IG5hbWU/LmlzQ29tcGxleCgpXG4gICAgICAgICAgICByZXR1cm4gW3RoaXMsIHRoaXNdICAjIGBhYCBgYS5iYFxuICAgICAgICBiYXNlID0gbmV3IFZhbHVlIEBiYXNlLCBAcHJvcGVydGllc1suLi4tMV1cbiAgICAgICAgaWYgYmFzZS5pc0NvbXBsZXgoKSAgIyBgYSgpLmJgXG4gICAgICAgICAgICBicmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdiYXNlJ1xuICAgICAgICAgICAgYmFzZSA9IG5ldyBWYWx1ZSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gYnJlZiwgYmFzZVxuICAgICAgICByZXR1cm4gW2Jhc2UsIGJyZWZdIHVubGVzcyBuYW1lICAjIGBhKClgXG4gICAgICAgIGlmIG5hbWUuaXNDb21wbGV4KCkgICMgYGFbYigpXWBcbiAgICAgICAgICAgIG5yZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ25hbWUnXG4gICAgICAgICAgICBuYW1lID0gbmV3IEluZGV4IG5ldyBBc3NpZ24gbnJlZiwgbmFtZS5pbmRleFxuICAgICAgICAgICAgbnJlZiA9IG5ldyBJbmRleCBucmVmXG4gICAgICAgIFtiYXNlLmFkZChuYW1lKSwgbmV3IFZhbHVlKGJyZWYgb3IgYmFzZS5iYXNlLCBbbnJlZiBvciBuYW1lXSldXG5cbiAgICAjIFdlIGNvbXBpbGUgYSB2YWx1ZSB0byBKYXZhU2NyaXB0IGJ5IGNvbXBpbGluZyBhbmQgam9pbmluZyBlYWNoIHByb3BlcnR5LlxuICAgICMgVGhpbmdzIGdldCBtdWNoIG1vcmUgaW50ZXJlc3RpbmcgaWYgdGhlIGNoYWluIG9mIHByb3BlcnRpZXMgaGFzICpzb2FrKlxuICAgICMgb3BlcmF0b3JzIGA/LmAgaW50ZXJzcGVyc2VkLiBUaGVuIHdlIGhhdmUgdG8gdGFrZSBjYXJlIG5vdCB0byBhY2NpZGVudGFsbHlcbiAgICAjIGV2YWx1YXRlIGFueXRoaW5nIHR3aWNlIHdoZW4gYnVpbGRpbmcgdGhlIHNvYWsgY2hhaW4uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgQGJhc2UuZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgcHJvcHMgPSBAcHJvcGVydGllc1xuICAgICAgICBmcmFnbWVudHMgPSBAYmFzZS5jb21waWxlVG9GcmFnbWVudHMgbywgKGlmIHByb3BzLmxlbmd0aCB0aGVuIExFVkVMX0FDQ0VTUyBlbHNlIG51bGwpXG4gICAgICAgIGlmIHByb3BzLmxlbmd0aCBhbmQgU0lNUExFTlVNLnRlc3QgZnJhZ21lbnRzVG9UZXh0IGZyYWdtZW50c1xuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICcuJ1xuICAgICAgICBmb3IgcHJvcCBpbiBwcm9wc1xuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggKHByb3AuY29tcGlsZVRvRnJhZ21lbnRzIG8pLi4uXG4gICAgICAgIGZyYWdtZW50c1xuXG4gICAgIyBVbmZvbGQgYSBzb2FrIGludG8gYW4gYElmYDogYGE/LmJgIC0+IGBhLmIgaWYgYT9gXG4gICAgXG4gICAgdW5mb2xkU29hazogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBAdW5mb2xkZWRTb2FrID89IGRvID0+XG4gICAgICAgICAgICBpZiBpZm4gPSBAYmFzZS51bmZvbGRTb2FrIG9cbiAgICAgICAgICAgICAgICBpZm4uYm9keS5wcm9wZXJ0aWVzLnB1c2ggQHByb3BlcnRpZXMuLi5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWZuXG4gICAgICAgICAgICBmb3IgcHJvcCwgaSBpbiBAcHJvcGVydGllcyB3aGVuIHByb3Auc29ha1xuICAgICAgICAgICAgICAgIHByb3Auc29hayA9IG9mZlxuICAgICAgICAgICAgICAgIGZzdCA9IG5ldyBWYWx1ZSBAYmFzZSwgQHByb3BlcnRpZXNbLi4uaV1cbiAgICAgICAgICAgICAgICBzbmQgPSBuZXcgVmFsdWUgQGJhc2UsIEBwcm9wZXJ0aWVzW2kuLl1cbiAgICAgICAgICAgICAgICBpZiBmc3QuaXNDb21wbGV4KClcbiAgICAgICAgICAgICAgICAgICAgcmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnXG4gICAgICAgICAgICAgICAgICAgIGZzdCA9IG5ldyBQYXJlbnMgbmV3IEFzc2lnbiByZWYsIGZzdFxuICAgICAgICAgICAgICAgICAgICBzbmQuYmFzZSA9IHJlZlxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgSWYgbmV3IEV4aXN0ZW5jZShmc3QpLCBzbmQsIHNvYWs6IG9uXG4gICAgICAgICAgICBub1xuXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5Db21tZW50ID0gY2xhc3MgQ29tbWVudCBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBjb21tZW50KSAtPlxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIG1ha2VSZXR1cm46ICBUSElTXG5cbiAgICBjb21waWxlTm9kZTogKG8sIGxldmVsKSAtPlxuICAgICAgICBcbiAgICAgICAgY29tbWVudCA9IEBjb21tZW50LnJlcGxhY2UgL14oXFxzKikjKD89XFxzKS9nbSwgXCIkMSAqXCJcbiAgICAgICAgY29kZSA9IFwiLyoje211bHRpZGVudCBjb21tZW50LCBAdGFifSN7aWYgJ1xcbicgaW4gY29tbWVudCB0aGVuIFwiXFxuI3tAdGFifVwiIGVsc2UgJyd9ICovXCJcbiAgICAgICAgY29kZSA9IG8uaW5kZW50ICsgY29kZSBpZiAobGV2ZWwgb3Igby5sZXZlbCkgaXMgTEVWRUxfVE9QXG4gICAgICAgIFtAbWFrZUNvZGUoXCJcXG5cIiksIEBtYWtlQ29kZShjb2RlKV1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4jIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMCAgXG5cbiMgTm9kZSBmb3IgYSBmdW5jdGlvbiBpbnZvY2F0aW9uLlxuICAgIFxuZXhwb3J0cy5DYWxsID0gY2xhc3MgQ2FsbCBleHRlbmRzIEJhc2VcbiAgICBjb25zdHJ1Y3RvcjogKEB2YXJpYWJsZSwgQGFyZ3MgPSBbXSwgQHNvYWspIC0+XG4gICAgICAgIEBpc05ldyAgICAgID0gZmFsc2VcbiAgICAgICAgaWYgQHZhcmlhYmxlIGluc3RhbmNlb2YgVmFsdWUgYW5kIEB2YXJpYWJsZS5pc05vdENhbGxhYmxlKClcbiAgICAgICAgICAgIEB2YXJpYWJsZS5lcnJvciBcImxpdGVyYWwgaXMgbm90IGEgZnVuY3Rpb25cIlxuXG4gICAgY2hpbGRyZW46IFsndmFyaWFibGUnLCAnYXJncyddXG5cbiAgICAjIFdoZW4gc2V0dGluZyB0aGUgbG9jYXRpb24sIHdlIHNvbWV0aW1lcyBuZWVkIHRvIHVwZGF0ZSB0aGUgc3RhcnQgbG9jYXRpb24gdG9cbiAgICAjIGFjY291bnQgZm9yIGEgbmV3bHktZGlzY292ZXJlZCBgbmV3YCBvcGVyYXRvciB0byB0aGUgbGVmdCBvZiB1cy4gVGhpc1xuICAgICMgZXhwYW5kcyB0aGUgcmFuZ2Ugb24gdGhlIGxlZnQsIGJ1dCBub3QgdGhlIHJpZ2h0LlxuICAgIFxuICAgIHVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZzogKGxvY2F0aW9uRGF0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsb2NhdGlvbkRhdGEgYW5kIEBuZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uXG4gICAgICAgICAgICBAbG9jYXRpb25EYXRhLmZpcnN0X2xpbmUgPSBsb2NhdGlvbkRhdGEuZmlyc3RfbGluZVxuICAgICAgICAgICAgQGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW4gPSBsb2NhdGlvbkRhdGEuZmlyc3RfY29sdW1uXG4gICAgICAgICAgICBiYXNlID0gQHZhcmlhYmxlPy5iYXNlIG9yIEB2YXJpYWJsZVxuICAgICAgICAgICAgaWYgYmFzZS5uZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uXG4gICAgICAgICAgICAgICAgQHZhcmlhYmxlLmxvY2F0aW9uRGF0YS5maXJzdF9saW5lID0gbG9jYXRpb25EYXRhLmZpcnN0X2xpbmVcbiAgICAgICAgICAgICAgICBAdmFyaWFibGUubG9jYXRpb25EYXRhLmZpcnN0X2NvbHVtbiA9IGxvY2F0aW9uRGF0YS5maXJzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICBiYXNlLnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBsb2NhdGlvbkRhdGFcbiAgICAgICAgICAgIGRlbGV0ZSBAbmVlZHNVcGRhdGVkU3RhcnRMb2NhdGlvblxuICAgICAgICBzdXBlclxuXG4gICAgIyBUYWcgdGhpcyBpbnZvY2F0aW9uIGFzIGNyZWF0aW5nIGEgbmV3IGluc3RhbmNlLlxuICAgIG5ld0luc3RhbmNlOiAtPlxuICAgICAgICBiYXNlID0gQHZhcmlhYmxlPy5iYXNlIG9yIEB2YXJpYWJsZVxuICAgICAgICBpZiBiYXNlIGluc3RhbmNlb2YgQ2FsbCBhbmQgbm90IGJhc2UuaXNOZXdcbiAgICAgICAgICAgIGJhc2UubmV3SW5zdGFuY2UoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXNOZXcgPSB0cnVlXG4gICAgICAgIEBuZWVkc1VwZGF0ZWRTdGFydExvY2F0aW9uID0gdHJ1ZVxuICAgICAgICB0aGlzXG5cbiAgICAjIFNvYWtlZCBjaGFpbmVkIGludm9jYXRpb25zIHVuZm9sZCBpbnRvIGlmL2Vsc2UgdGVybmFyeSBzdHJ1Y3R1cmVzLlxuICAgIHVuZm9sZFNvYWs6IChvKSAtPlxuICAgICAgICBpZiBAc29ha1xuICAgICAgICAgICAgaWYgdGhpcyBpbnN0YW5jZW9mIFN1cGVyQ2FsbFxuICAgICAgICAgICAgICAgIGxlZnQgPSBuZXcgTGl0ZXJhbCBAc3VwZXJSZWZlcmVuY2Ugb1xuICAgICAgICAgICAgICAgIHJpdGUgPSBuZXcgVmFsdWUgbGVmdFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBpZm4gaWYgaWZuID0gdW5mb2xkU29hayBvLCB0aGlzLCAndmFyaWFibGUnXG4gICAgICAgICAgICAgICAgW2xlZnQsIHJpdGVdID0gbmV3IFZhbHVlKEB2YXJpYWJsZSkuY2FjaGVSZWZlcmVuY2Ugb1xuICAgICAgICAgICAgcml0ZSA9IG5ldyBDYWxsIHJpdGUsIEBhcmdzXG4gICAgICAgICAgICByaXRlLmlzTmV3ID0gQGlzTmV3XG4gICAgICAgICAgICBsZWZ0ID0gbmV3IExpdGVyYWwgXCJ0eXBlb2YgI3sgbGVmdC5jb21waWxlIG8gfSA9PT0gXFxcImZ1bmN0aW9uXFxcIlwiXG4gICAgICAgICAgICByZXR1cm4gbmV3IElmIGxlZnQsIG5ldyBWYWx1ZShyaXRlKSwgc29hazogeWVzXG4gICAgICAgIGNhbGwgPSB0aGlzXG4gICAgICAgIGxpc3QgPSBbXVxuICAgICAgICBsb29wXG4gICAgICAgICAgICBpZiBjYWxsLnZhcmlhYmxlIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICAgICAgICAgIGxpc3QucHVzaCBjYWxsXG4gICAgICAgICAgICAgICAgY2FsbCA9IGNhbGwudmFyaWFibGVcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIGNhbGwudmFyaWFibGUgaW5zdGFuY2VvZiBWYWx1ZVxuICAgICAgICAgICAgbGlzdC5wdXNoIGNhbGxcbiAgICAgICAgICAgIGJyZWFrIHVubGVzcyAoY2FsbCA9IGNhbGwudmFyaWFibGUuYmFzZSkgaW5zdGFuY2VvZiBDYWxsXG4gICAgICAgIGZvciBjYWxsIGluIGxpc3QucmV2ZXJzZSgpXG4gICAgICAgICAgICBpZiBpZm5cbiAgICAgICAgICAgICAgICBpZiBjYWxsLnZhcmlhYmxlIGluc3RhbmNlb2YgQ2FsbFxuICAgICAgICAgICAgICAgICAgICBjYWxsLnZhcmlhYmxlID0gaWZuXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjYWxsLnZhcmlhYmxlLmJhc2UgPSBpZm5cbiAgICAgICAgICAgIGlmbiA9IHVuZm9sZFNvYWsgbywgY2FsbCwgJ3ZhcmlhYmxlJ1xuICAgICAgICBpZm5cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT4gIyBDb21waWxlIGEgdmFuaWxsYSBmdW5jdGlvbiBjYWxsLlxuICAgICAgICBcbiAgICAgICAgQHZhcmlhYmxlPy5mcm9udCA9IEBmcm9udFxuICAgICAgICBjb21waWxlZEFycmF5ID0gU3BsYXQuY29tcGlsZVNwbGF0dGVkQXJyYXkgbywgQGFyZ3MsIHRydWVcbiAgICAgICAgaWYgY29tcGlsZWRBcnJheS5sZW5ndGhcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVNwbGF0IG8sIGNvbXBpbGVkQXJyYXlcbiAgICAgICAgY29tcGlsZWRBcmdzID0gW11cbiAgICAgICAgZm9yIGFyZywgYXJnSW5kZXggaW4gQGFyZ3NcbiAgICAgICAgICAgIGlmIGFyZ0luZGV4IHRoZW4gY29tcGlsZWRBcmdzLnB1c2ggQG1ha2VDb2RlIFwiLCBcIlxuICAgICAgICAgICAgY29tcGlsZWRBcmdzLnB1c2ggKGFyZy5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCkuLi5cblxuICAgICAgICBmcmFnbWVudHMgPSBbXVxuICAgICAgICBpZiB0aGlzIGluc3RhbmNlb2YgU3VwZXJDYWxsXG4gICAgICAgICAgICBwcmVmYWNlID0gQHN1cGVyUmVmZXJlbmNlKG8pICsgXCIuY2FsbCgje0BzdXBlclRoaXMobyl9XCJcbiAgICAgICAgICAgIGlmIGNvbXBpbGVkQXJncy5sZW5ndGggdGhlbiBwcmVmYWNlICs9IFwiLCBcIlxuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlIHByZWZhY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGlzTmV3IHRoZW4gZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICduZXcgJ1xuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9BQ0NFU1MpLi4uXG4gICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgXCIoXCJcbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggY29tcGlsZWRBcmdzLi4uXG4gICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBcIilcIlxuICAgICAgICBmcmFnbWVudHNcblxuICAgICMgSWYgeW91IGNhbGwgYSBmdW5jdGlvbiB3aXRoIGEgc3BsYXQsIGl0J3MgY29udmVydGVkIGludG8gYSBKYXZhU2NyaXB0XG4gICAgIyBgLmFwcGx5KClgIGNhbGwgdG8gYWxsb3cgYW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZC5cbiAgICAjIElmIGl0J3MgYSBjb25zdHJ1Y3RvciwgdGhlbiB0aGluZ3MgZ2V0IHJlYWwgdHJpY2t5LiBXZSBoYXZlIHRvIGluamVjdCBhblxuICAgICMgaW5uZXIgY29uc3RydWN0b3IgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBwYXNzIHRoZSB2YXJhcmdzLlxuICAgICNcbiAgICAjIHNwbGF0QXJncyBpcyBhbiBhcnJheSBvZiBDb2RlRnJhZ21lbnRzIHRvIHB1dCBpbnRvIHRoZSAnYXBwbHknLlxuICAgIFxuICAgIGNvbXBpbGVTcGxhdDogKG8sIHNwbGF0QXJncykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHRoaXMgaW5zdGFuY2VvZiBTdXBlckNhbGxcbiAgICAgICAgICAgIHJldHVybiBbXS5jb25jYXQgQG1ha2VDb2RlKFwiI3sgQHN1cGVyUmVmZXJlbmNlIG8gfS5hcHBseSgje0BzdXBlclRoaXMobyl9LCBcIiksXG4gICAgICAgICAgICAgICAgc3BsYXRBcmdzLCBAbWFrZUNvZGUoXCIpXCIpXG5cbiAgICAgICAgaWYgQGlzTmV3XG4gICAgICAgICAgICBpZHQgPSBAdGFiICsgVEFCXG4gICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IEBtYWtlQ29kZShcIlwiXCJcbiAgICAgICAgICAgICAgICAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgICAgICAgICAgICN7aWR0fWN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICAgICAgICAgICAgI3tpZHR9dmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICN7aWR0fXJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgICAgICAgICAgICAgI3tAdGFifX0pKFwiXCJcIiksXG4gICAgICAgICAgICAgICAgKEB2YXJpYWJsZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCksXG4gICAgICAgICAgICAgICAgQG1ha2VDb2RlKFwiLCBcIiksIHNwbGF0QXJncywgQG1ha2VDb2RlKFwiLCBmdW5jdGlvbigpe30pXCIpXG5cbiAgICAgICAgYW5zd2VyID0gW11cbiAgICAgICAgYmFzZSA9IG5ldyBWYWx1ZSBAdmFyaWFibGVcbiAgICAgICAgaWYgKG5hbWUgPSBiYXNlLnByb3BlcnRpZXMucG9wKCkpIGFuZCBiYXNlLmlzQ29tcGxleCgpXG4gICAgICAgICAgICByZWYgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVmJ1xuICAgICAgICAgICAgYW5zd2VyID0gYW5zd2VyLmNvbmNhdCBAbWFrZUNvZGUoXCIoI3tyZWZ9ID0gXCIpLFxuICAgICAgICAgICAgICAgIChiYXNlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUKSxcbiAgICAgICAgICAgICAgICBAbWFrZUNvZGUoXCIpXCIpLFxuICAgICAgICAgICAgICAgIG5hbWUuY29tcGlsZVRvRnJhZ21lbnRzKG8pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZ1biA9IGJhc2UuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0FDQ0VTU1xuICAgICAgICAgICAgZnVuID0gQHdyYXBJbkJyYWNlcyBmdW4gaWYgU0lNUExFTlVNLnRlc3QgZnJhZ21lbnRzVG9UZXh0IGZ1blxuICAgICAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgICAgIHJlZiA9IGZyYWdtZW50c1RvVGV4dCBmdW5cbiAgICAgICAgICAgICAgICBmdW4ucHVzaCAobmFtZS5jb21waWxlVG9GcmFnbWVudHMgbykuLi5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZWYgPSAnbnVsbCdcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgZnVuXG4gICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgQG1ha2VDb2RlKFwiLmFwcGx5KCN7cmVmfSwgXCIpLCBzcGxhdEFyZ3MsIEBtYWtlQ29kZShcIilcIilcblxuIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFRha2VzIGNhcmUgb2YgY29udmVydGluZyBgc3VwZXIoKWAgY2FsbHMgaW50byBjYWxscyBhZ2FpbnN0IHRoZSBwcm90b3R5cGUncyBmdW5jdGlvbiBvZiB0aGUgc2FtZSBuYW1lLlxuXG5leHBvcnRzLlN1cGVyQ2FsbCA9IGNsYXNzIFN1cGVyQ2FsbCBleHRlbmRzIENhbGxcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgICAgIHN1cGVyIG51bGwsIGFyZ3MgPyBbbmV3IFNwbGF0IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCAnYXJndW1lbnRzJ11cbiAgICAgICAgIyBBbGxvdyB0byByZWNvZ25pemUgYSBiYXJlIGBzdXBlcmAgY2FsbCB3aXRob3V0IHBhcmVudGhlc2VzIGFuZCBhcmd1bWVudHMuXG4gICAgICAgIEBpc0JhcmUgPSBhcmdzP1xuXG4gICAgIyBHcmFiIHRoZSByZWZlcmVuY2UgdG8gdGhlIHN1cGVyY2xhc3MncyBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgY3VycmVudCBtZXRob2QuXG4gICAgXG4gICAgc3VwZXJSZWZlcmVuY2U6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgbWV0aG9kID0gby5zY29wZS5uYW1lZE1ldGhvZCgpXG4gICAgICAgIGlmIG1ldGhvZD8ua2xhc3NcbiAgICAgICAgICAgIHtrbGFzcywgbmFtZSwgdmFyaWFibGV9ID0gbWV0aG9kXG4gICAgICAgICAgICBpZiBrbGFzcy5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgICAgIGJyZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5wYXJlbnQuZnJlZVZhcmlhYmxlICdiYXNlJ1xuICAgICAgICAgICAgICAgIGJhc2UgPSBuZXcgVmFsdWUgbmV3IFBhcmVucyBuZXcgQXNzaWduIGJyZWYsIGtsYXNzXG4gICAgICAgICAgICAgICAgdmFyaWFibGUuYmFzZSA9IGJhc2VcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5wcm9wZXJ0aWVzLnNwbGljZSAwLCBrbGFzcy5wcm9wZXJ0aWVzLmxlbmd0aFxuICAgICAgICAgICAgaWYgbmFtZS5pc0NvbXBsZXgoKSBvciAobmFtZSBpbnN0YW5jZW9mIEluZGV4IGFuZCBuYW1lLmluZGV4LmlzQXNzaWduYWJsZSgpKVxuICAgICAgICAgICAgICAgIG5yZWYgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5wYXJlbnQuZnJlZVZhcmlhYmxlICduYW1lJ1xuICAgICAgICAgICAgICAgIG5hbWUgPSBuZXcgSW5kZXggbmV3IEFzc2lnbiBucmVmLCBuYW1lLmluZGV4XG4gICAgICAgICAgICAgICAgdmFyaWFibGUucHJvcGVydGllcy5wb3AoKVxuICAgICAgICAgICAgICAgIHZhcmlhYmxlLnByb3BlcnRpZXMucHVzaCBuYW1lXG4gICAgICAgICAgICBhY2Nlc3NlcyA9IFtuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgJ19fc3VwZXJfXyddXG4gICAgICAgICAgICBhY2Nlc3Nlcy5wdXNoIG5ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAnY29uc3RydWN0b3InIGlmIG1ldGhvZC5zdGF0aWNcbiAgICAgICAgICAgIGFjY2Vzc2VzLnB1c2ggaWYgbnJlZj8gdGhlbiBuZXcgSW5kZXggbnJlZiBlbHNlIG5hbWVcbiAgICAgICAgICAgIChuZXcgVmFsdWUgYnJlZiA/IGtsYXNzLCBhY2Nlc3NlcykuY29tcGlsZSBvXG4gICAgICAgIGVsc2UgaWYgbWV0aG9kPy5jdG9yXG4gICAgICAgICAgICAjIGxvZyBcIlN1cGVyQ2FsbC5zdXBlclJlZmVyZW5jZSAje21ldGhvZC5uYW1lfSBkYWR1bW0hXCJcbiAgICAgICAgICAgIFwiI3ttZXRob2QubmFtZX0uX19zdXBlcl9fLmNvbnN0cnVjdG9yXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGVycm9yICdjYW5ub3QgY2FsbCBzdXBlciBvdXRzaWRlIG9mIGFuIGluc3RhbmNlIG1ldGhvZC4nXG5cbiAgICAjIFRoZSBhcHByb3ByaWF0ZSBgdGhpc2AgdmFsdWUgZm9yIGEgYHN1cGVyYCBjYWxsLlxuICAgICAgICBcbiAgICBzdXBlclRoaXM6IChvKSAtPlxuICAgICAgICBtZXRob2QgPSBvLnNjb3BlLm1ldGhvZFxuICAgICAgICAobWV0aG9kIGFuZCBub3QgbWV0aG9kLmtsYXNzIGFuZCBtZXRob2QuY29udGV4dCkgb3IgXCJ0aGlzXCJcblxuICAgIGNvbXBpbGVTcGxhdDogKG8sIHNwbGF0QXJncykgLT5cbiAgICAgICAgIyBsb2cgJ2NvbXBpbGVTcGxhdCcsIG8uZmVhdHVyZVxuICAgICAgICBpZiBzcGxhdEFyZ3MubGVuZ3RoID09IDEgYW5kIHNwbGF0QXJnc1swXS5jb2RlID09ICdhcmd1bWVudHMnIGFuZCBAY29uZmlnUGFyYW1ldGVyPyBhbmQgby5mZWF0dXJlWydjb25maWctcGFyYW1ldGVycyddXG4gICAgICAgICAgICAjIFRPRE86IHNob3VsZG4ndCBhbGwgcmVmZXJlbmNlcyB0byBhcmd1bWVudHMgYmUgY29udmVydGVkP1xuICAgICAgICAgICAgcmV0dXJuIFtdLmNvbmNhdCBAbWFrZUNvZGUoXCIje0Bjb25maWdQYXJhbWV0ZXJDb2RlQmVmb3JlU3VwZXIoKX0jeyBAc3VwZXJSZWZlcmVuY2UgbyB9LmFwcGx5KCN7QHN1cGVyVGhpcyhvKX0sIFwiKSwgc3BsYXRBcmdzLCBAbWFrZUNvZGUoXCIpXCIpXG4gICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgXG4gICAgY29uZmlnUGFyYW1ldGVyQ29kZUJlZm9yZVN1cGVyOiAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuICcnIGlmIG5vdCBwYXJhbSA9IEBjb25maWdQYXJhbWV0ZXJcblxuICAgICAgICBhID0gcGFyYW0ub2JqZWN0cy5tYXAgKG9iaikgLT4gXG4gICAgICAgICAgICBuID0gb2JqLnZhcmlhYmxlLmJhc2UudmFsdWVcbiAgICAgICAgICAgIHQgPSBvYmoudmFsdWUudmFyaWFibGUudGhpcyBhbmQgJ3RoaXMuJyBvciAnJ1xuICAgICAgICAgICAgXCIje259OiN7dCtufVwiXG4gICAgICAgICAgICBcbiAgICAgICAgXCJhcmd1bWVudHNbMF0gPSBfLmRlZmF1bHRzKHsje2Euam9pbiAnLCd9fSwgYXJndW1lbnRzWzBdKTsgXCJcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIFJlZ2V4ZXMgd2l0aCBpbnRlcnBvbGF0aW9ucyBhcmUgaW4gZmFjdCBqdXN0IGEgdmFyaWF0aW9uIG9mIGEgYENhbGxgIChhXG4jIGBSZWdFeHAoKWAgY2FsbCB0byBiZSBwcmVjaXNlKSB3aXRoIGEgYFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9uc2AgaW5zaWRlLlxuXG5leHBvcnRzLlJlZ2V4V2l0aEludGVycG9sYXRpb25zID0gY2xhc3MgUmVnZXhXaXRoSW50ZXJwb2xhdGlvbnMgZXh0ZW5kcyBDYWxsXG4gICAgY29uc3RydWN0b3I6IChhcmdzID0gW10pIC0+XG4gICAgICAgIHN1cGVyIChuZXcgVmFsdWUgbmV3IElkZW50aWZpZXJMaXRlcmFsICdSZWdFeHAnKSwgYXJncywgZmFsc2VcblxuIyBUYWdnZWRUZW1wbGF0ZUNhbGxcblxuZXhwb3J0cy5UYWdnZWRUZW1wbGF0ZUNhbGwgPSBjbGFzcyBUYWdnZWRUZW1wbGF0ZUNhbGwgZXh0ZW5kcyBDYWxsXG4gICAgY29uc3RydWN0b3I6ICh2YXJpYWJsZSwgYXJnLCBzb2FrKSAtPlxuICAgICAgICBhcmcgPSBuZXcgU3RyaW5nV2l0aEludGVycG9sYXRpb25zIEJsb2NrLndyYXAoWyBuZXcgVmFsdWUgYXJnIF0pIGlmIGFyZyBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxcbiAgICAgICAgc3VwZXIgdmFyaWFibGUsIFsgYXJnIF0sIHNvYWtcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgIyBUZWxsIGBTdHJpbmdXaXRoSW50ZXJwb2xhdGlvbnNgIHdoZXRoZXIgdG8gY29tcGlsZSBhcyBFUzIwMTUgb3Igbm90OyB3aWxsIGJlIHJlbW92ZWQgaW4gS29mZmVlIDIuXG4gICAgICAgIG8uaW5UYWdnZWRUZW1wbGF0ZUNhbGwgPSB5ZXNcbiAgICAgICAgQHZhcmlhYmxlLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9BQ0NFU1MpLmNvbmNhdCBAYXJnc1swXS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfTElTVClcblxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuXG4jIE5vZGUgdG8gZXh0ZW5kIGFuIG9iamVjdCdzIHByb3RvdHlwZSB3aXRoIGFuIGFuY2VzdG9yIG9iamVjdC5cbiMgQWZ0ZXIgYGdvb2cuaW5oZXJpdHNgIGZyb20gdGhlXG4jIFtDbG9zdXJlIExpYnJhcnldKGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2xvc3VyZS1saWJyYXJ5L2Jsb2IvbWFzdGVyL2Nsb3N1cmUvZ29vZy9iYXNlLmpzKS5cblxuZXhwb3J0cy5FeHRlbmRzID0gY2xhc3MgRXh0ZW5kcyBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBjaGlsZCwgQHBhcmVudCkgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2NoaWxkJywgJ3BhcmVudCddXG5cbiAgICAjIEhvb2tzIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIncyBwcm90b3R5cGUgY2hhaW4uXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobykgLT5cbiAgICAgICAgbmV3IENhbGwobmV3IFZhbHVlKG5ldyBMaXRlcmFsIHV0aWxpdHkgJ2V4dGVuZCcsIG8pLCBbQGNoaWxkLCBAcGFyZW50XSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBBIGAuYCBhY2Nlc3MgaW50byBhIHByb3BlcnR5IG9mIGEgdmFsdWUsIG9yIHRoZSBgOjpgIHNob3J0aGFuZCBmb3JcbiMgYW4gYWNjZXNzIGludG8gdGhlIG9iamVjdCdzIHByb3RvdHlwZS5cblxuZXhwb3J0cy5BY2Nlc3MgPSBjbGFzcyBBY2Nlc3MgZXh0ZW5kcyBCYXNlXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgdGFnKSAtPlxuICAgICAgICBAc29hayA9IHRhZyBpcyAnc29haydcblxuICAgIGNoaWxkcmVuOiBbJ25hbWUnXVxuXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobykgLT5cbiAgICAgICAgbmFtZSA9IEBuYW1lLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIG5vZGUgPSBAbmFtZS51bndyYXAoKVxuICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgUHJvcGVydHlOYW1lXG4gICAgICAgICAgICBpZiBub2RlLnZhbHVlIGluIEpTX0ZPUkJJRERFTlxuICAgICAgICAgICAgICAgIFtAbWFrZUNvZGUoJ1tcIicpLCBuYW1lLi4uLCBAbWFrZUNvZGUoJ1wiXScpXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFtAbWFrZUNvZGUoJy4nKSwgbmFtZS4uLl1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgW0BtYWtlQ29kZSgnWycpLCBuYW1lLi4uLCBAbWFrZUNvZGUoJ10nKV1cblxuICAgIGlzQ29tcGxleDogTk9cblxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgMDAwICAgXG4jIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbiMgQSBgWyAuLi4gXWAgaW5kZXhlZCBhY2Nlc3MgaW50byBhbiBhcnJheSBvciBvYmplY3QuXG5cbmV4cG9ydHMuSW5kZXggPSBjbGFzcyBJbmRleCBleHRlbmRzIEJhc2VcbiAgICBjb25zdHJ1Y3RvcjogKEBpbmRleCkgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2luZGV4J11cblxuICAgIGNvbXBpbGVUb0ZyYWdtZW50czogKG8pIC0+XG4gICAgICAgIFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJbXCIpLCBAaW5kZXguY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSwgQG1ha2VDb2RlKFwiXVwiKVxuXG4gICAgaXNDb21wbGV4OiAtPlxuICAgICAgICBAaW5kZXguaXNDb21wbGV4KClcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbiMgUmFuZ2VzIGNhbiBiZSB1c2VkIHRvIGV4dHJhY3QgcG9ydGlvbnMgKHNsaWNlcykgb2YgYXJyYXlzLFxuIyB0byBzcGVjaWZ5IGEgcmFuZ2UgZm9yIGNvbXByZWhlbnNpb25zLCBvciBhcyBhIHZhbHVlLCB0byBiZSBleHBhbmRlZCBpbnRvIHRoZVxuIyBjb3JyZXNwb25kaW5nIGFycmF5IG9mIGludGVnZXJzIGF0IHJ1bnRpbWUuXG5cbmV4cG9ydHMuUmFuZ2UgPSBjbGFzcyBSYW5nZSBleHRlbmRzIEJhc2VcblxuICAgIGNoaWxkcmVuOiBbJ2Zyb20nLCAndG8nXVxuXG4gICAgY29uc3RydWN0b3I6IChAZnJvbSwgQHRvLCB0YWcpIC0+XG4gICAgICAgIEBleGNsdXNpdmUgPSB0YWcgaXMgJ2V4Y2x1c2l2ZSdcbiAgICAgICAgQGVxdWFscyA9IGlmIEBleGNsdXNpdmUgdGhlbiAnJyBlbHNlICc9J1xuXG4gICAgIyBDb21waWxlcyB0aGUgcmFuZ2UncyBzb3VyY2UgdmFyaWFibGVzIC0tIHdoZXJlIGl0IHN0YXJ0cyBhbmQgd2hlcmUgaXQgZW5kcy5cbiAgICAjIEJ1dCBvbmx5IGlmIHRoZXkgbmVlZCB0byBiZSBjYWNoZWQgdG8gYXZvaWQgZG91YmxlIGV2YWx1YXRpb24uXG4gICAgXG4gICAgY29tcGlsZVZhcmlhYmxlczogKG8pIC0+XG4gICAgICAgIG8gPSBtZXJnZSBvLCB0b3A6IHRydWVcbiAgICAgICAgaXNDb21wbGV4ID0gZGVsIG8sICdpc0NvbXBsZXgnXG4gICAgICAgIFtAZnJvbUMsIEBmcm9tVmFyXSA9IEBjYWNoZVRvQ29kZUZyYWdtZW50cyBAZnJvbS5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXhcbiAgICAgICAgW0B0b0MsIEB0b1Zhcl0gICAgID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIEB0by5jYWNoZSBvLCBMRVZFTF9MSVNULCBpc0NvbXBsZXhcbiAgICAgICAgW0BzdGVwLCBAc3RlcFZhcl0gID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIHN0ZXAuY2FjaGUgbywgTEVWRUxfTElTVCwgaXNDb21wbGV4IGlmIHN0ZXAgPSBkZWwgbywgJ3N0ZXAnXG4gICAgICAgIEBmcm9tTnVtID0gaWYgQGZyb20uaXNOdW1iZXIoKSB0aGVuIE51bWJlciBAZnJvbVZhciBlbHNlIG51bGxcbiAgICAgICAgQHRvTnVtICAgPSBpZiBAdG8uaXNOdW1iZXIoKSAgIHRoZW4gTnVtYmVyIEB0b1ZhciAgIGVsc2UgbnVsbFxuICAgICAgICBAc3RlcE51bSA9IGlmIHN0ZXA/LmlzTnVtYmVyKCkgdGhlbiBOdW1iZXIgQHN0ZXBWYXIgZWxzZSBudWxsXG5cbiAgICAjIFdoZW4gY29tcGlsZWQgbm9ybWFsbHksIHRoZSByYW5nZSByZXR1cm5zIHRoZSBjb250ZW50cyBvZiB0aGUgKmZvciBsb29wKlxuICAgICMgbmVlZGVkIHRvIGl0ZXJhdGUgb3ZlciB0aGUgdmFsdWVzIGluIHRoZSByYW5nZS4gVXNlZCBieSBjb21wcmVoZW5zaW9ucy5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBjb21waWxlVmFyaWFibGVzIG8gdW5sZXNzIEBmcm9tVmFyXG4gICAgICAgIHJldHVybiBAY29tcGlsZUFycmF5KG8pIHVubGVzcyBvLmluZGV4XG5cbiAgICAgICAgIyBTZXQgdXAgZW5kcG9pbnRzLlxuICAgICAgICBrbm93biAgICA9IEBmcm9tTnVtPyBhbmQgQHRvTnVtP1xuICAgICAgICBpZHggICAgICA9IGRlbCBvLCAnaW5kZXgnXG4gICAgICAgIGlkeE5hbWUgID0gZGVsIG8sICduYW1lJ1xuICAgICAgICBuYW1lZEluZGV4ID0gaWR4TmFtZSBhbmQgaWR4TmFtZSAhPSBpZHhcbiAgICAgICAgdmFyUGFydCAgPSBcIiN7aWR4fSA9ICN7QGZyb21DfVwiXG4gICAgICAgIHZhclBhcnQgKz0gXCIsICN7QHRvQ31cIiBpZiBAdG9DICE9IEB0b1ZhclxuICAgICAgICB2YXJQYXJ0ICs9IFwiLCAje0BzdGVwfVwiIGlmIEBzdGVwICE9IEBzdGVwVmFyXG4gICAgICAgIFtsdCwgZ3RdID0gW1wiI3tpZHh9IDwje0BlcXVhbHN9XCIsIFwiI3tpZHh9ID4je0BlcXVhbHN9XCJdXG5cbiAgICAgICAgIyBHZW5lcmF0ZSB0aGUgY29uZGl0aW9uLlxuICAgICAgICBjb25kUGFydCA9IGlmIEBzdGVwTnVtP1xuICAgICAgICAgICAgaWYgQHN0ZXBOdW0gPiAwIHRoZW4gXCIje2x0fSAje0B0b1Zhcn1cIiBlbHNlIFwiI3tndH0gI3tAdG9WYXJ9XCJcbiAgICAgICAgZWxzZSBpZiBrbm93blxuICAgICAgICAgICAgW2Zyb20sIHRvXSA9IFtAZnJvbU51bSwgQHRvTnVtXVxuICAgICAgICAgICAgaWYgZnJvbSA8PSB0byB0aGVuIFwiI3tsdH0gI3t0b31cIiBlbHNlIFwiI3tndH0gI3t0b31cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25kID0gaWYgQHN0ZXBWYXIgdGhlbiBcIiN7QHN0ZXBWYXJ9ID4gMFwiIGVsc2UgXCIje0Bmcm9tVmFyfSA8PSAje0B0b1Zhcn1cIlxuICAgICAgICAgICAgXCIje2NvbmR9ID8gI3tsdH0gI3tAdG9WYXJ9IDogI3tndH0gI3tAdG9WYXJ9XCJcblxuICAgICAgICAjIEdlbmVyYXRlIHRoZSBzdGVwLlxuICAgICAgICBzdGVwUGFydCA9IGlmIEBzdGVwVmFyXG4gICAgICAgICAgICBcIiN7aWR4fSArPSAje0BzdGVwVmFyfVwiXG4gICAgICAgIGVsc2UgaWYga25vd25cbiAgICAgICAgICAgIGlmIG5hbWVkSW5kZXhcbiAgICAgICAgICAgICAgICBpZiBmcm9tIDw9IHRvIHRoZW4gXCIrKyN7aWR4fVwiIGVsc2UgXCItLSN7aWR4fVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgZnJvbSA8PSB0byB0aGVuIFwiI3tpZHh9KytcIiBlbHNlIFwiI3tpZHh9LS1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBuYW1lZEluZGV4XG4gICAgICAgICAgICAgICAgXCIje2NvbmR9ID8gKysje2lkeH0gOiAtLSN7aWR4fVwiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgXCIje2NvbmR9ID8gI3tpZHh9KysgOiAje2lkeH0tLVwiXG5cbiAgICAgICAgdmFyUGFydCAgPSBcIiN7aWR4TmFtZX0gPSAje3ZhclBhcnR9XCIgaWYgbmFtZWRJbmRleFxuICAgICAgICBzdGVwUGFydCA9IFwiI3tpZHhOYW1lfSA9ICN7c3RlcFBhcnR9XCIgaWYgbmFtZWRJbmRleFxuXG4gICAgICAgICMgVGhlIGZpbmFsIGxvb3AgYm9keS5cbiAgICAgICAgW0BtYWtlQ29kZSBcIiN7dmFyUGFydH07ICN7Y29uZFBhcnR9OyAje3N0ZXBQYXJ0fVwiXVxuXG5cbiAgICAjIFdoZW4gdXNlZCBhcyBhIHZhbHVlLCBleHBhbmQgdGhlIHJhbmdlIGludG8gdGhlIGVxdWl2YWxlbnQgYXJyYXkuXG4gICAgY29tcGlsZUFycmF5OiAobykgLT5cbiAgICAgICAga25vd24gPSBAZnJvbU51bT8gYW5kIEB0b051bT9cbiAgICAgICAgaWYga25vd24gYW5kIE1hdGguYWJzKEBmcm9tTnVtIC0gQHRvTnVtKSA8PSAyMFxuICAgICAgICAgICAgcmFuZ2UgPSBbQGZyb21OdW0uLkB0b051bV1cbiAgICAgICAgICAgIHJhbmdlLnBvcCgpIGlmIEBleGNsdXNpdmVcbiAgICAgICAgICAgIHJldHVybiBbQG1ha2VDb2RlIFwiWyN7IHJhbmdlLmpvaW4oJywgJykgfV1cIl1cbiAgICAgICAgaWR0ICAgID0gQHRhYiArIFRBQlxuICAgICAgICBpICAgICAgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnaScsIHNpbmdsZTogdHJ1ZVxuICAgICAgICByZXN1bHQgPSBvLnNjb3BlLmZyZWVWYXJpYWJsZSAncmVzdWx0cydcbiAgICAgICAgcHJlICAgID0gXCJcXG4je2lkdH0je3Jlc3VsdH0gPSBbXTtcIlxuICAgICAgICBpZiBrbm93blxuICAgICAgICAgICAgby5pbmRleCA9IGlcbiAgICAgICAgICAgIGJvZHkgPSBmcmFnbWVudHNUb1RleHQgQGNvbXBpbGVOb2RlIG9cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdmFycyA9IFwiI3tpfSA9ICN7QGZyb21DfVwiICsgaWYgQHRvQyAhPSBAdG9WYXIgdGhlbiBcIiwgI3tAdG9DfVwiIGVsc2UgJydcbiAgICAgICAgICAgIGNvbmQgPSBcIiN7QGZyb21WYXJ9IDw9ICN7QHRvVmFyfVwiXG4gICAgICAgICAgICBib2R5ID0gXCJ2YXIgI3t2YXJzfTsgI3tjb25kfSA/ICN7aX0gPCN7QGVxdWFsc30gI3tAdG9WYXJ9IDogI3tpfSA+I3tAZXF1YWxzfSAje0B0b1Zhcn07ICN7Y29uZH0gPyAje2l9KysgOiAje2l9LS1cIlxuICAgICAgICBwb3N0ICAgICA9IFwieyAje3Jlc3VsdH0ucHVzaCgje2l9KTsgfVxcbiN7aWR0fXJldHVybiAje3Jlc3VsdH07XFxuI3tvLmluZGVudH1cIlxuICAgICAgICBoYXNBcmdzID0gKG5vZGUpIC0+IG5vZGU/LmNvbnRhaW5zIGlzTGl0ZXJhbEFyZ3VtZW50c1xuICAgICAgICBhcmdzICAgID0gJywgYXJndW1lbnRzJyBpZiBoYXNBcmdzKEBmcm9tKSBvciBoYXNBcmdzKEB0bylcbiAgICAgICAgW0BtYWtlQ29kZSBcIihmdW5jdGlvbigpIHsje3ByZX1cXG4je2lkdH1mb3IgKCN7Ym9keX0pI3twb3N0fX0pLmFwcGx5KHRoaXMje2FyZ3MgPyAnJ30pXCJdXG5cbiMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiMgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBBbiBhcnJheSBzbGljZSBsaXRlcmFsLiBVbmxpa2UgSmF2YVNjcmlwdCdzIGBBcnJheSNzbGljZWAsIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4jIHNwZWNpZmllcyB0aGUgaW5kZXggb2YgdGhlIGVuZCBvZiB0aGUgc2xpY2UsIGp1c3QgYXMgdGhlIGZpcnN0IHBhcmFtZXRlclxuIyBpcyB0aGUgaW5kZXggb2YgdGhlIGJlZ2lubmluZy5cblxuZXhwb3J0cy5TbGljZSA9IGNsYXNzIFNsaWNlIGV4dGVuZHMgQmFzZVxuXG4gICAgY2hpbGRyZW46IFsncmFuZ2UnXVxuXG4gICAgY29uc3RydWN0b3I6IChAcmFuZ2UpIC0+XG4gICAgICAgIHN1cGVyKClcblxuICAgICMgV2UgaGF2ZSB0byBiZSBjYXJlZnVsIHdoZW4gdHJ5aW5nIHRvIHNsaWNlIHRocm91Z2ggdGhlIGVuZCBvZiB0aGUgYXJyYXksXG4gICAgIyBgOWU5YCBpcyB1c2VkIGJlY2F1c2Ugbm90IGFsbCBpbXBsZW1lbnRhdGlvbnMgcmVzcGVjdCBgdW5kZWZpbmVkYCBvciBgMS8wYC5cbiAgICAjIGA5ZTlgIHNob3VsZCBiZSBzYWZlIGJlY2F1c2UgYDllOWAgPiBgMioqMzJgLCB0aGUgbWF4IGFycmF5IGxlbmd0aC5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIHt0bywgZnJvbX0gPSBAcmFuZ2VcbiAgICAgICAgZnJvbUNvbXBpbGVkID0gZnJvbSBhbmQgZnJvbS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pIG9yIFtAbWFrZUNvZGUgJzAnXVxuICAgICAgICAjIFRPRE86IGp3YWx0b24gLSBtb3ZlIHRoaXMgaW50byB0aGUgJ2lmJz9cbiAgICAgICAgaWYgdG9cbiAgICAgICAgICAgIGNvbXBpbGVkICAgICAgICAgPSB0by5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfUEFSRU5cbiAgICAgICAgICAgIGNvbXBpbGVkVGV4dCA9IGZyYWdtZW50c1RvVGV4dCBjb21waWxlZFxuICAgICAgICAgICAgaWYgbm90IChub3QgQHJhbmdlLmV4Y2x1c2l2ZSBhbmQgK2NvbXBpbGVkVGV4dCBpcyAtMSlcbiAgICAgICAgICAgICAgICB0b1N0ciA9ICcsICcgKyBpZiBAcmFuZ2UuZXhjbHVzaXZlXG4gICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkVGV4dFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgdG8uaXNOdW1iZXIoKVxuICAgICAgICAgICAgICAgICAgICBcIiN7K2NvbXBpbGVkVGV4dCArIDF9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkID0gdG8uY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0FDQ0VTU1xuICAgICAgICAgICAgICAgICAgICBcIisje2ZyYWdtZW50c1RvVGV4dCBjb21waWxlZH0gKyAxIHx8IDllOVwiXG4gICAgICAgIFtAbWFrZUNvZGUgXCIuc2xpY2UoI3sgZnJhZ21lbnRzVG9UZXh0IGZyb21Db21waWxlZCB9I3sgdG9TdHIgb3IgJycgfSlcIl1cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5PYmogPSBjbGFzcyBPYmogZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChwcm9wcywgQGdlbmVyYXRlZCA9IGZhbHNlKSAtPlxuICAgICAgICBAb2JqZWN0cyA9IEBwcm9wZXJ0aWVzID0gcHJvcHMgb3IgW11cblxuICAgIGNoaWxkcmVuOiBbJ3Byb3BlcnRpZXMnXVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBwcm9wcyA9IEBwcm9wZXJ0aWVzXG4gICAgICAgIGlmIEBnZW5lcmF0ZWRcbiAgICAgICAgICAgIGZvciBub2RlIGluIHByb3BzIHdoZW4gbm9kZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgICAgICAgICAgbm9kZS5lcnJvciAnY2Fubm90IGhhdmUgYW4gaW1wbGljaXQgdmFsdWUgaW4gYW4gaW1wbGljaXQgb2JqZWN0J1xuICAgICAgICBicmVhayBmb3IgcHJvcCwgZHluYW1pY0luZGV4IGluIHByb3BzIHdoZW4gKHByb3AudmFyaWFibGUgb3IgcHJvcCkuYmFzZSBpbnN0YW5jZW9mIFBhcmVuc1xuICAgICAgICBoYXNEeW5hbWljICA9IGR5bmFtaWNJbmRleCA8IHByb3BzLmxlbmd0aFxuICAgICAgICBpZHQgICAgICAgICA9IG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBsYXN0Tm9uY29tICA9IEBsYXN0Tm9uQ29tbWVudCBAcHJvcGVydGllc1xuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICBpZiBoYXNEeW5hbWljXG4gICAgICAgICAgICBvcmVmID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ29iaidcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIihcXG4je2lkdH0je29yZWZ9ID0gXCJcbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwieyN7aWYgcHJvcHMubGVuZ3RoIGlzIDAgb3IgZHluYW1pY0luZGV4IGlzIDAgdGhlbiAnfScgZWxzZSAnXFxuJ31cIlxuICAgICAgICBmb3IgcHJvcCwgaSBpbiBwcm9wc1xuICAgICAgICAgICAgaWYgaSBpcyBkeW5hbWljSW5kZXhcbiAgICAgICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJcXG4je2lkdH19XCIgdW5sZXNzIGkgaXMgMFxuICAgICAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSAnLFxcbidcbiAgICAgICAgICAgIGpvaW4gPSBpZiBpIGlzIHByb3BzLmxlbmd0aCAtIDEgb3IgaSBpcyBkeW5hbWljSW5kZXggLSAxXG4gICAgICAgICAgICAgICAgJydcbiAgICAgICAgICAgIGVsc2UgaWYgcHJvcCBpcyBsYXN0Tm9uY29tIG9yIHByb3AgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgJ1xcbidcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAnLFxcbidcbiAgICAgICAgICAgIGluZGVudCA9IGlmIHByb3AgaW5zdGFuY2VvZiBDb21tZW50IHRoZW4gJycgZWxzZSBpZHRcbiAgICAgICAgICAgIGluZGVudCArPSBUQUIgaWYgaGFzRHluYW1pYyBhbmQgaSA8IGR5bmFtaWNJbmRleFxuICAgICAgICAgICAgaWYgcHJvcCBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgIGlmIHByb3AuY29udGV4dCAhPSAnb2JqZWN0J1xuICAgICAgICAgICAgICAgICAgICBwcm9wLm9wZXJhdG9yVG9rZW4uZXJyb3IgXCJ1bmV4cGVjdGVkICN7cHJvcC5vcGVyYXRvclRva2VuLnZhbHVlfVwiXG4gICAgICAgICAgICAgICAgaWYgcHJvcC52YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBwcm9wLnZhcmlhYmxlLmhhc1Byb3BlcnRpZXMoKVxuICAgICAgICAgICAgICAgICAgICBwcm9wLnZhcmlhYmxlLmVycm9yICdpbnZhbGlkIG9iamVjdCBrZXknXG4gICAgICAgICAgICBpZiBwcm9wIGluc3RhbmNlb2YgVmFsdWUgYW5kIHByb3AudGhpc1xuICAgICAgICAgICAgICAgIHByb3AgPSBuZXcgQXNzaWduIHByb3AucHJvcGVydGllc1swXS5uYW1lLCBwcm9wLCAnb2JqZWN0J1xuICAgICAgICAgICAgaWYgcHJvcCBub3QgaW5zdGFuY2VvZiBDb21tZW50XG4gICAgICAgICAgICAgICAgaWYgaSA8IGR5bmFtaWNJbmRleFxuICAgICAgICAgICAgICAgICAgICBpZiBwcm9wIG5vdCBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcCA9IG5ldyBBc3NpZ24gcHJvcCwgcHJvcCwgJ29iamVjdCdcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIHByb3AgaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IHByb3AudmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcHJvcC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBba2V5LCB2YWx1ZV0gPSBwcm9wLmJhc2UuY2FjaGUgb1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5ID0gbmV3IFByb3BlcnR5TmFtZSBrZXkudmFsdWUgaWYga2V5IGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgcHJvcCA9IG5ldyBBc3NpZ24gKG5ldyBWYWx1ZSAobmV3IElkZW50aWZpZXJMaXRlcmFsIG9yZWYpLCBbbmV3IEFjY2VzcyBrZXldKSwgdmFsdWVcbiAgICAgICAgICAgIGlmIGluZGVudCB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBpbmRlbnRcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIHByb3AuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1RPUCkuLi5cbiAgICAgICAgICAgIGlmIGpvaW4gdGhlbiBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgam9pblxuICAgICAgICBpZiBoYXNEeW5hbWljXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCIsXFxuI3tpZHR9I3tvcmVmfVxcbiN7QHRhYn0pXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlIFwiXFxuI3tAdGFifX1cIiB1bmxlc3MgcHJvcHMubGVuZ3RoIGlzIDBcbiAgICAgICAgaWYgQGZyb250IGFuZCBub3QgaGFzRHluYW1pYyB0aGVuIEB3cmFwSW5CcmFjZXMgYW5zd2VyIGVsc2UgYW5zd2VyXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgZm9yIHByb3AgaW4gQHByb3BlcnRpZXMgd2hlbiBwcm9wLmFzc2lnbnMgbmFtZSB0aGVuIHJldHVybiB5ZXNcbiAgICAgICAgbm9cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5BcnIgPSBjbGFzcyBBcnIgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChvYmpzKSAtPlxuICAgICAgICBAb2JqZWN0cyA9IG9ianMgb3IgW11cblxuICAgIGNoaWxkcmVuOiBbJ29iamVjdHMnXVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICByZXR1cm4gW0BtYWtlQ29kZSAnW10nXSB1bmxlc3MgQG9iamVjdHMubGVuZ3RoXG4gICAgICAgIG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBhbnN3ZXIgPSBTcGxhdC5jb21waWxlU3BsYXR0ZWRBcnJheSBvLCBAb2JqZWN0c1xuICAgICAgICByZXR1cm4gYW5zd2VyIGlmIGFuc3dlci5sZW5ndGhcblxuICAgICAgICBhbnN3ZXIgPSBbXVxuICAgICAgICBjb21waWxlZE9ianMgPSAob2JqLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUIGZvciBvYmogaW4gQG9iamVjdHMpXG4gICAgICAgIGZvciBmcmFnbWVudHMsIGluZGV4IGluIGNvbXBpbGVkT2Jqc1xuICAgICAgICAgICAgaWYgaW5kZXhcbiAgICAgICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCIsIFwiXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBmcmFnbWVudHMuLi5cbiAgICAgICAgaWYgZnJhZ21lbnRzVG9UZXh0KGFuc3dlcikuaW5kZXhPZignXFxuJykgPj0gMFxuICAgICAgICAgICAgYW5zd2VyLnVuc2hpZnQgQG1ha2VDb2RlIFwiW1xcbiN7by5pbmRlbnR9XCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIlxcbiN7QHRhYn1dXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYW5zd2VyLnVuc2hpZnQgQG1ha2VDb2RlIFwiW1wiXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJdXCJcbiAgICAgICAgYW5zd2VyXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgZm9yIG9iaiBpbiBAb2JqZWN0cyB3aGVuIG9iai5hc3NpZ25zIG5hbWUgdGhlbiByZXR1cm4geWVzXG4gICAgICAgIG5vXG5cbiMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcblxuIyBUaGUgY2xhc3MgZGVmaW5pdGlvbi4gSW5pdGlhbGl6ZSBhIENsYXNzIHdpdGggaXRzIG5hbWUsIGFuIG9wdGlvbmFsIHN1cGVyY2xhc3MsIGFuZCBhIGxpc3Qgb2YgcHJvdG90eXBlIHByb3BlcnR5IGFzc2lnbm1lbnRzLlxuXG5leHBvcnRzLkNsYXNzID0gY2xhc3MgQ2xhc3MgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAdmFyaWFibGUsIEBwYXJlbnQsIEBib2R5ID0gbmV3IEJsb2NrKSAtPlxuICAgICAgICBAYm91bmRGdW5jcyA9IFtdXG4gICAgICAgIEBib2R5LmNsYXNzQm9keSA9IHllc1xuXG4gICAgY2hpbGRyZW46IFsndmFyaWFibGUnLCAncGFyZW50JywgJ2JvZHknXVxuXG4gICAgZGVmYXVsdENsYXNzVmFyaWFibGVOYW1lOiAnX0NsYXNzJ1xuXG4gICAgIyBGaWd1cmUgb3V0IHRoZSBhcHByb3ByaWF0ZSBuYW1lIGZvciB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb24gb2YgdGhpcyBjbGFzcy5cbiAgICAgICAgXG4gICAgZGV0ZXJtaW5lTmFtZTogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAZGVmYXVsdENsYXNzVmFyaWFibGVOYW1lIHVubGVzcyBAdmFyaWFibGVcbiAgICAgICAgWy4uLiwgdGFpbF0gPSBAdmFyaWFibGUucHJvcGVydGllc1xuICAgICAgICBub2RlID0gaWYgdGFpbFxuICAgICAgICAgICAgdGFpbCBpbnN0YW5jZW9mIEFjY2VzcyBhbmQgdGFpbC5uYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB2YXJpYWJsZS5iYXNlXG4gICAgICAgIHVubGVzcyBub2RlIGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgb3Igbm9kZSBpbnN0YW5jZW9mIFByb3BlcnR5TmFtZVxuICAgICAgICAgICAgcmV0dXJuIEBkZWZhdWx0Q2xhc3NWYXJpYWJsZU5hbWVcbiAgICAgICAgbmFtZSA9IG5vZGUudmFsdWVcbiAgICAgICAgdW5sZXNzIHRhaWxcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBuYW1lXG4gICAgICAgICAgICBAdmFyaWFibGUuZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgIGlmIG5hbWUgaW4gSlNfRk9SQklEREVOIHRoZW4gXCJfI3tuYW1lfVwiIGVsc2UgbmFtZVxuXG4gICAgIyBGb3IgYWxsIGB0aGlzYC1yZWZlcmVuY2VzIGFuZCBib3VuZCBmdW5jdGlvbnMgaW4gdGhlIGNsYXNzIGRlZmluaXRpb24sIGB0aGlzYCBpcyB0aGUgQ2xhc3MgYmVpbmcgY29uc3RydWN0ZWQuXG4gICAgICAgIFxuICAgIHNldENvbnRleHQ6IChuYW1lKSAtPlxuICAgICAgICBcbiAgICAgICAgQGJvZHkudHJhdmVyc2VDaGlsZHJlbiBmYWxzZSwgKG5vZGUpIC0+XG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm9kZS5jbGFzc0JvZHlcbiAgICAgICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBUaGlzTGl0ZXJhbFxuICAgICAgICAgICAgICAgIG5vZGUudmFsdWUgICAgICA9IG5hbWVcbiAgICAgICAgICAgIGVsc2UgaWYgbm9kZSBpbnN0YW5jZW9mIENvZGVcbiAgICAgICAgICAgICAgICBub2RlLmNvbnRleHQgICAgPSBuYW1lIGlmIG5vZGUuYm91bmRcblxuICAgICMgRW5zdXJlIHRoYXQgYWxsIGZ1bmN0aW9ucyBib3VuZCB0byB0aGUgaW5zdGFuY2UgYXJlIHByb3hpZWQgaW4gdGhlIGNvbnN0cnVjdG9yLlxuICAgIFxuICAgIGFkZEJvdW5kRnVuY3Rpb25zOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBidmFyIGluIEBib3VuZEZ1bmNzXG4gICAgICAgICAgICBsaHMgPSAobmV3IFZhbHVlIChuZXcgVGhpc0xpdGVyYWwpLCBbbmV3IEFjY2VzcyBidmFyXSkuY29tcGlsZSBvXG4gICAgICAgICAgICBAY3Rvci5ib2R5LnVuc2hpZnQgbmV3IExpdGVyYWwgXCIje2xoc30gPSAje3V0aWxpdHkgJ2JpbmQnLCBvfSgje2xoc30sIHRoaXMpXCJcbiAgICAgICAgcmV0dXJuXG5cbiAgICAjIE1lcmdlIHRoZSBwcm9wZXJ0aWVzIGZyb20gYSB0b3AtbGV2ZWwgb2JqZWN0IGFzIHByb3RvdHlwYWwgcHJvcGVydGllcyBvbiB0aGUgY2xhc3MuXG4gICAgXG4gICAgYWRkUHJvcGVydGllczogKG5vZGUsIG5hbWUsIG8pIC0+XG4gICAgICAgIFxuICAgICAgICBwcm9wcyA9IG5vZGUuYmFzZS5wcm9wZXJ0aWVzWy4uXVxuICAgICAgICBleHBycyA9IHdoaWxlIGFzc2lnbiA9IHByb3BzLnNoaWZ0KClcbiAgICAgICAgICAgIGlmIGFzc2lnbiBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgIGJhc2UgPSBhc3NpZ24udmFyaWFibGUuYmFzZVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBhc3NpZ24uY29udGV4dFxuICAgICAgICAgICAgICAgIGZ1bmMgPSBhc3NpZ24udmFsdWVcbiAgICAgICAgICAgICAgICBpZiBiYXNlLnZhbHVlIGlzICdjb25zdHJ1Y3RvcidcbiAgICAgICAgICAgICAgICAgICAgaWYgQGN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbi5lcnJvciAnY2Fubm90IGRlZmluZSBtb3JlIHRoYW4gb25lIGNvbnN0cnVjdG9yIGluIGEgY2xhc3MnXG4gICAgICAgICAgICAgICAgICAgIGlmIGZ1bmMuYm91bmRcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbi5lcnJvciAnY2Fubm90IGRlZmluZSBhIGNvbnN0cnVjdG9yIGFzIGEgYm91bmQgZnVuY3Rpb24nXG4gICAgICAgICAgICAgICAgICAgIGlmIGZ1bmMgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ24gPSBAY3RvciA9IGZ1bmNcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGV4dGVybmFsQ3RvciA9IG8uY2xhc3NTY29wZS5mcmVlVmFyaWFibGUgJ2N0b3InXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ24gPSBuZXcgQXNzaWduIG5ldyBJZGVudGlmaWVyTGl0ZXJhbChAZXh0ZXJuYWxDdG9yKSwgZnVuY1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgYXNzaWduLnZhcmlhYmxlLnRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMuc3RhdGljID0geWVzXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGlmIGJhc2UuaXNDb21wbGV4KCkgdGhlbiBuZXcgSW5kZXggYmFzZSBlbHNlIG5ldyBBY2Nlc3MgYmFzZVxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzaWduLnZhcmlhYmxlID0gbmV3IFZhbHVlKG5ldyBJZGVudGlmaWVyTGl0ZXJhbChuYW1lKSwgWyhuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUgJ3Byb3RvdHlwZScpLCBhY2NdKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZnVuYyBpbnN0YW5jZW9mIENvZGUgYW5kIGZ1bmMuYm91bmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYm91bmRGdW5jcy5wdXNoIGJhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jLmJvdW5kID0gbm9cbiAgICAgICAgICAgIGFzc2lnblxuXG4gICAgICAgIGNvbXBhY3QgZXhwcnNcblxuICAgICMgV2FsayB0aGUgYm9keSBvZiB0aGUgY2xhc3MsIGxvb2tpbmcgZm9yIHByb3RvdHlwZSBwcm9wZXJ0aWVzIHRvIGJlIGNvbnZlcnRlZCBhbmQgdGFnZ2luZyBzdGF0aWMgYXNzaWdubWVudHMuXG4gICAgICAgIFxuICAgIHdhbGtCb2R5OiAobmFtZSwgbykgLT5cbiAgICAgICAgI2xvZyAnd2Fsa0JvZHknLCBvLmZlYXR1cmVcbiAgICAgICAgQHRyYXZlcnNlQ2hpbGRyZW4gZmFsc2UsIChjaGlsZCkgPT5cbiAgICAgICAgICAgIGNvbnQgPSB0cnVlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgY2hpbGQgaW5zdGFuY2VvZiBDbGFzc1xuICAgICAgICAgICAgaWYgY2hpbGQgaW5zdGFuY2VvZiBCbG9ja1xuICAgICAgICAgICAgICAgIGZvciBub2RlLCBpIGluIGV4cHMgPSBjaGlsZC5leHByZXNzaW9uc1xuICAgICAgICAgICAgICAgICAgICBpZiBub2RlIGluc3RhbmNlb2YgQXNzaWduIGFuZCBub2RlLnZhcmlhYmxlLmxvb2tzU3RhdGljIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUudmFsdWUuc3RhdGljID0geWVzXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9kZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBub2RlLmlzT2JqZWN0KHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cHNbaV0gPSBAYWRkUHJvcGVydGllcyBub2RlLCBuYW1lLCBvXG4gICAgICAgICAgICAgICAgY2hpbGQuZXhwcmVzc2lvbnMgPSBleHBzID0gZmxhdHRlbiBleHBzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgY2hpbGQuY2xhc3NCb2R5IGFuZCBvLmZlYXR1cmVbJ2NvbmZpZy1wYXJhbWV0ZXJzJ11cbiAgICAgICAgICAgICAgICAgICAgQHByZXBhcmVTdXBlckNhbGxGb3JDb25maWdQYXJhbXMgbmFtZSwgbywgY2hpbGRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnQgYW5kIGNoaWxkIG5vdCBpbnN0YW5jZW9mIENsYXNzXG5cbiAgICBwcmVwYXJlU3VwZXJDYWxsRm9yQ29uZmlnUGFyYW1zOiAobmFtZSwgbywgY2xhc3NCb2R5KSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGV4cHIgaW4gY2xhc3NCb2R5LmV4cHJlc3Npb25zXG4gICAgICAgICAgICBpZiBleHByIGluc3RhbmNlb2YgQ29kZVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBleHByLnBhcmFtc1swXT8ubmFtZVxuICAgICAgICAgICAgICAgIHBhcmFtMCA9IGV4cHIucGFyYW1zWzBdLm5hbWVcbiAgICAgICAgICAgICAgICBpZiBub3QgcGFyYW0wLmdlbmVyYXRlZCB0aGVuIHJldHVybiAjbG9nICdDT05TVFJVQ1RPUiBQQVJBTTAgTk9UIEdFTkVSQVRFRD8nXG4gICAgICAgICAgICAgICAgaWYgbm90IHBhcmFtMCBpbnN0YW5jZW9mIE9iaiB0aGVuIHJldHVybiBsb2cgJ0NPTlNUUlVDVE9SIFBBUkFNMCBOT1QgQU4gT0JKPydcbiAgICAgICAgICAgICAgICBpZiBub3QgZXhwci5ib2R5IGluc3RhbmNlb2YgQmxvY2sgdGhlbiByZXR1cm4gbG9nICdDT05TVFJVQ1RPUiBCT0RZIE5PVCBBTiBCTE9DSz8nXG4gICAgICAgICAgICAgICAgZm9yIGJvZHlFeHByIGluIGV4cHIuYm9keS5leHByZXNzaW9uc1xuICAgICAgICAgICAgICAgICAgICBpZiBib2R5RXhwciBpbnN0YW5jZW9mIFN1cGVyQ2FsbFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keUV4cHIuY29uZmlnUGFyYW1ldGVyID0gcGFyYW0wXG4gICAgICAgICAgICBcbiAgICAjIGB1c2Ugc3RyaWN0YCAoYW5kIG90aGVyIGRpcmVjdGl2ZXMpIG11c3QgYmUgdGhlIGZpcnN0IGV4cHJlc3Npb24gc3RhdGVtZW50KHMpXG4gICAgIyBvZiBhIGZ1bmN0aW9uIGJvZHkuIFRoaXMgbWV0aG9kIGVuc3VyZXMgdGhlIHByb2xvZ3VlIGlzIGNvcnJlY3RseSBwb3NpdGlvbmVkXG4gICAgIyBhYm92ZSB0aGUgYGNvbnN0cnVjdG9yYC5cbiAgICBcbiAgICBob2lzdERpcmVjdGl2ZVByb2xvZ3VlOiAtPlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIHtleHByZXNzaW9uc30gPSBAYm9keVxuICAgICAgICArK2luZGV4IHdoaWxlIChub2RlID0gZXhwcmVzc2lvbnNbaW5kZXhdKSBhbmQgbm9kZSBpbnN0YW5jZW9mIENvbW1lbnQgb3JcbiAgICAgICAgICAgIG5vZGUgaW5zdGFuY2VvZiBWYWx1ZSBhbmQgbm9kZS5pc1N0cmluZygpXG4gICAgICAgIEBkaXJlY3RpdmVzID0gZXhwcmVzc2lvbnMuc3BsaWNlIDAsIGluZGV4XG5cbiAgICAjIE1ha2Ugc3VyZSB0aGF0IGEgY29uc3RydWN0b3IgaXMgZGVmaW5lZCBmb3IgdGhlIGNsYXNzLCBhbmQgcHJvcGVybHkgY29uZmlndXJlZC5cbiAgICAgICAgXG4gICAgZW5zdXJlQ29uc3RydWN0b3I6IChuYW1lKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBjdG9yXG4gICAgICAgICAgICBAY3RvciA9IG5ldyBDb2RlXG4gICAgICAgICAgICBpZiBAZXh0ZXJuYWxDdG9yXG4gICAgICAgICAgICAgICAgQGN0b3IuYm9keS5wdXNoIG5ldyBMaXRlcmFsIFwiI3tAZXh0ZXJuYWxDdG9yfS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXCJcbiAgICAgICAgICAgIGVsc2UgaWYgQHBhcmVudFxuICAgICAgICAgICAgICAgIEBjdG9yLmJvZHkucHVzaCBuZXcgTGl0ZXJhbCBcIiN7bmFtZX0uX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcIlxuICAgICAgICAgICAgQGN0b3IuYm9keS5tYWtlUmV0dXJuKClcbiAgICAgICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgQGN0b3JcbiAgICAgICAgQGN0b3IuY3RvciA9IEBjdG9yLm5hbWUgPSBuYW1lXG4gICAgICAgIEBjdG9yLmtsYXNzID0gbnVsbFxuICAgICAgICBAY3Rvci5ub1JldHVybiA9IHllc1xuXG4gICAgIyBJbnN0ZWFkIG9mIGdlbmVyYXRpbmcgdGhlIEphdmFTY3JpcHQgc3RyaW5nIGRpcmVjdGx5LCB3ZSBidWlsZCB1cCB0aGVcbiAgICAjIGVxdWl2YWxlbnQgc3ludGF4IHRyZWUgYW5kIGNvbXBpbGUgdGhhdCwgaW4gcGllY2VzLiBZb3UgY2FuIHNlZSB0aGVcbiAgICAjIGNvbnN0cnVjdG9yLCBwcm9wZXJ0eSBhc3NpZ25tZW50cywgYW5kIGluaGVyaXRhbmNlIGdldHRpbmcgYnVpbHQgb3V0IGJlbG93LlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGp1bXBOb2RlID0gQGJvZHkuanVtcHMoKVxuICAgICAgICAgICAganVtcE5vZGUuZXJyb3IgJ0NsYXNzIGJvZGllcyBjYW5ub3QgY29udGFpbiBwdXJlIHN0YXRlbWVudHMnXG4gICAgICAgIGlmIGFyZ3VtZW50c05vZGUgPSBAYm9keS5jb250YWlucyBpc0xpdGVyYWxBcmd1bWVudHNcbiAgICAgICAgICAgIGFyZ3VtZW50c05vZGUuZXJyb3IgXCJDbGFzcyBib2RpZXMgc2hvdWxkbid0IHJlZmVyZW5jZSBhcmd1bWVudHNcIlxuXG4gICAgICAgIG5hbWUgID0gQGRldGVybWluZU5hbWUoKVxuICAgICAgICBsbmFtZSA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBuYW1lXG4gICAgICAgIGZ1bmMgID0gbmV3IENvZGUgW10sIEJsb2NrLndyYXAgW0Bib2R5XVxuICAgICAgICBhcmdzICA9IFtdXG4gICAgICAgIG8uY2xhc3NTY29wZSA9IGZ1bmMubWFrZVNjb3BlIG8uc2NvcGVcblxuICAgICAgICBAaG9pc3REaXJlY3RpdmVQcm9sb2d1ZSgpXG4gICAgICAgIEBzZXRDb250ZXh0IG5hbWVcbiAgICAgICAgQHdhbGtCb2R5IG5hbWUsIG9cbiAgICAgICAgQGVuc3VyZUNvbnN0cnVjdG9yIG5hbWVcbiAgICAgICAgQGFkZEJvdW5kRnVuY3Rpb25zIG9cbiAgICAgICAgQGJvZHkuc3BhY2VkID0geWVzXG4gICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnB1c2ggbG5hbWVcblxuICAgICAgICBpZiBAcGFyZW50XG4gICAgICAgICAgICBzdXBlckNsYXNzID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uY2xhc3NTY29wZS5mcmVlVmFyaWFibGUgJ3N1cGVyQ2xhc3MnLCByZXNlcnZlOiBub1xuICAgICAgICAgICAgQGJvZHkuZXhwcmVzc2lvbnMudW5zaGlmdCBuZXcgRXh0ZW5kcyBsbmFtZSwgc3VwZXJDbGFzc1xuICAgICAgICAgICAgZnVuYy5wYXJhbXMucHVzaCBuZXcgUGFyYW0gc3VwZXJDbGFzc1xuICAgICAgICAgICAgYXJncy5wdXNoIEBwYXJlbnRcblxuICAgICAgICBAYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IEBkaXJlY3RpdmVzLi4uXG5cbiAgICAgICAga2xhc3MgPSBuZXcgUGFyZW5zIG5ldyBDYWxsIGZ1bmMsIGFyZ3NcbiAgICAgICAga2xhc3MgPSBuZXcgQXNzaWduIEB2YXJpYWJsZSwga2xhc3MsIG51bGwsIHsgQG1vZHVsZURlY2xhcmF0aW9uIH0gaWYgQHZhcmlhYmxlXG4gICAgICAgIGtsYXNzLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5leHBvcnRzLk1vZHVsZURlY2xhcmF0aW9uID0gY2xhc3MgTW9kdWxlRGVjbGFyYXRpb24gZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAY2xhdXNlLCBAc291cmNlKSAtPlxuICAgICAgICBAY2hlY2tTb3VyY2UoKVxuXG4gICAgY2hpbGRyZW46IFsnY2xhdXNlJywgJ3NvdXJjZSddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG4gICAganVtcHM6ICAgICAgICAgICBUSElTXG4gICAgbWFrZVJldHVybjogIFRISVNcblxuICAgIGNoZWNrU291cmNlOiAtPlxuICAgICAgICBpZiBAc291cmNlPyBhbmQgQHNvdXJjZSBpbnN0YW5jZW9mIFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9uc1xuICAgICAgICAgICAgQHNvdXJjZS5lcnJvciAndGhlIG5hbWUgb2YgdGhlIG1vZHVsZSB0byBiZSBpbXBvcnRlZCBmcm9tIG11c3QgYmUgYW4gdW5pbnRlcnBvbGF0ZWQgc3RyaW5nJ1xuXG4gICAgY2hlY2tTY29wZTogKG8sIG1vZHVsZURlY2xhcmF0aW9uVHlwZSkgLT5cbiAgICAgICAgaWYgby5pbmRlbnQubGVuZ3RoICE9IDBcbiAgICAgICAgICAgIEBlcnJvciBcIiN7bW9kdWxlRGVjbGFyYXRpb25UeXBlfSBzdGF0ZW1lbnRzIG11c3QgYmUgYXQgdG9wLWxldmVsIHNjb3BlXCJcblxuIyAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbmV4cG9ydHMuSW1wb3J0RGVjbGFyYXRpb24gPSBjbGFzcyBJbXBvcnREZWNsYXJhdGlvbiBleHRlbmRzIE1vZHVsZURlY2xhcmF0aW9uXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBAY2hlY2tTY29wZSBvLCAnaW1wb3J0J1xuICAgICAgICBvLmltcG9ydGVkU3ltYm9scyA9IFtdXG5cbiAgICAgICAgY29kZSA9IFtdXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCIje0B0YWJ9aW1wb3J0IFwiXG4gICAgICAgIGNvZGUucHVzaCBAY2xhdXNlLmNvbXBpbGVOb2RlKG8pLi4uIGlmIEBjbGF1c2U/XG5cbiAgICAgICAgaWYgQHNvdXJjZT8udmFsdWU/XG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICcgZnJvbSAnIHVubGVzcyBAY2xhdXNlIGlzIG51bGxcbiAgICAgICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgQHNvdXJjZS52YWx1ZVxuXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJzsnXG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRDbGF1c2UgPSBjbGFzcyBJbXBvcnRDbGF1c2UgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAZGVmYXVsdEJpbmRpbmcsIEBuYW1lZEltcG9ydHMpIC0+XG5cbiAgICBjaGlsZHJlbjogWydkZWZhdWx0QmluZGluZycsICduYW1lZEltcG9ydHMnXVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBjb2RlID0gW11cblxuICAgICAgICBpZiBAZGVmYXVsdEJpbmRpbmc/XG4gICAgICAgICAgICBjb2RlLnB1c2ggQGRlZmF1bHRCaW5kaW5nLmNvbXBpbGVOb2RlKG8pLi4uXG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICcsICcgaWYgQG5hbWVkSW1wb3J0cz9cblxuICAgICAgICBpZiBAbmFtZWRJbXBvcnRzP1xuICAgICAgICAgICAgY29kZS5wdXNoIEBuYW1lZEltcG9ydHMuY29tcGlsZU5vZGUobykuLi5cblxuICAgICAgICBjb2RlXG5cbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuZXhwb3J0cy5FeHBvcnREZWNsYXJhdGlvbiA9IGNsYXNzIEV4cG9ydERlY2xhcmF0aW9uIGV4dGVuZHMgTW9kdWxlRGVjbGFyYXRpb25cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBjaGVja1Njb3BlIG8sICdleHBvcnQnXG5cbiAgICAgICAgY29kZSA9IFtdXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgXCIje0B0YWJ9ZXhwb3J0IFwiXG4gICAgICAgIGNvZGUucHVzaCBAbWFrZUNvZGUgJ2RlZmF1bHQgJyBpZiBAIGluc3RhbmNlb2YgRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uXG5cbiAgICAgICAgaWYgQCBub3QgaW5zdGFuY2VvZiBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24gYW5kXG4gICAgICAgICAgICAgKEBjbGF1c2UgaW5zdGFuY2VvZiBBc3NpZ24gb3IgQGNsYXVzZSBpbnN0YW5jZW9mIENsYXNzKVxuICAgICAgICAgICAgIyBQcmV2ZW50IGV4cG9ydGluZyBhbiBhbm9ueW1vdXMgY2xhc3M7IGFsbCBleHBvcnRlZCBtZW1iZXJzIG11c3QgYmUgbmFtZWRcbiAgICAgICAgICAgIGlmIEBjbGF1c2UgaW5zdGFuY2VvZiBDbGFzcyBhbmQgbm90IEBjbGF1c2UudmFyaWFibGVcbiAgICAgICAgICAgICAgICBAY2xhdXNlLmVycm9yICdhbm9ueW1vdXMgY2xhc3NlcyBjYW5ub3QgYmUgZXhwb3J0ZWQnXG5cbiAgICAgICAgICAgICMgV2hlbiB0aGUgRVMyMDE1IGBjbGFzc2Aga2V5d29yZCBpcyBzdXBwb3J0ZWQsIGRvbuKAmXQgYWRkIGEgYHZhcmAgaGVyZVxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSAndmFyICdcbiAgICAgICAgICAgIEBjbGF1c2UubW9kdWxlRGVjbGFyYXRpb24gPSAnZXhwb3J0J1xuXG4gICAgICAgIGlmIEBjbGF1c2UuYm9keT8gYW5kIEBjbGF1c2UuYm9keSBpbnN0YW5jZW9mIEJsb2NrXG4gICAgICAgICAgICBjb2RlID0gY29kZS5jb25jYXQgQGNsYXVzZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvZGUgPSBjb2RlLmNvbmNhdCBAY2xhdXNlLmNvbXBpbGVOb2RlIG9cblxuICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlIFwiIGZyb20gI3tAc291cmNlLnZhbHVlfVwiIGlmIEBzb3VyY2U/LnZhbHVlP1xuICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICc7J1xuICAgICAgICBjb2RlXG5cbmV4cG9ydHMuRXhwb3J0TmFtZWREZWNsYXJhdGlvbiA9IGNsYXNzIEV4cG9ydE5hbWVkRGVjbGFyYXRpb24gZXh0ZW5kcyBFeHBvcnREZWNsYXJhdGlvblxuXG5leHBvcnRzLkV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiA9IGNsYXNzIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiBleHRlbmRzIEV4cG9ydERlY2xhcmF0aW9uXG5cbmV4cG9ydHMuRXhwb3J0QWxsRGVjbGFyYXRpb24gPSBjbGFzcyBFeHBvcnRBbGxEZWNsYXJhdGlvbiBleHRlbmRzIEV4cG9ydERlY2xhcmF0aW9uXG5cbmV4cG9ydHMuTW9kdWxlU3BlY2lmaWVyTGlzdCA9IGNsYXNzIE1vZHVsZVNwZWNpZmllckxpc3QgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAc3BlY2lmaWVycykgLT5cblxuICAgIGNoaWxkcmVuOiBbJ3NwZWNpZmllcnMnXVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIGNvbXBpbGVkTGlzdCA9IChzcGVjaWZpZXIuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1QgZm9yIHNwZWNpZmllciBpbiBAc3BlY2lmaWVycylcblxuICAgICAgICBpZiBAc3BlY2lmaWVycy5sZW5ndGggIT0gMFxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIntcXG4je28uaW5kZW50fVwiXG4gICAgICAgICAgICBmb3IgZnJhZ21lbnRzLCBpbmRleCBpbiBjb21waWxlZExpc3RcbiAgICAgICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlKFwiLFxcbiN7by5pbmRlbnR9XCIpIGlmIGluZGV4XG4gICAgICAgICAgICAgICAgY29kZS5wdXNoIGZyYWdtZW50cy4uLlxuICAgICAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIlxcbn1cIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2RlLnB1c2ggQG1ha2VDb2RlICd7fSdcbiAgICAgICAgY29kZVxuXG5leHBvcnRzLkltcG9ydFNwZWNpZmllckxpc3QgPSBjbGFzcyBJbXBvcnRTcGVjaWZpZXJMaXN0IGV4dGVuZHMgTW9kdWxlU3BlY2lmaWVyTGlzdFxuXG5leHBvcnRzLkV4cG9ydFNwZWNpZmllckxpc3QgPSBjbGFzcyBFeHBvcnRTcGVjaWZpZXJMaXN0IGV4dGVuZHMgTW9kdWxlU3BlY2lmaWVyTGlzdFxuXG5leHBvcnRzLk1vZHVsZVNwZWNpZmllciA9IGNsYXNzIE1vZHVsZVNwZWNpZmllciBleHRlbmRzIEJhc2VcbiAgICBjb25zdHJ1Y3RvcjogKEBvcmlnaW5hbCwgQGFsaWFzLCBAbW9kdWxlRGVjbGFyYXRpb25UeXBlKSAtPlxuICAgICAgICAjIFRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZSBlbnRlcmluZyB0aGUgbG9jYWwgc2NvcGVcbiAgICAgICAgQGlkZW50aWZpZXIgPSBpZiBAYWxpYXM/IHRoZW4gQGFsaWFzLnZhbHVlIGVsc2UgQG9yaWdpbmFsLnZhbHVlXG5cbiAgICBjaGlsZHJlbjogWydvcmlnaW5hbCcsICdhbGlhcyddXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIG8uc2NvcGUuZmluZCBAaWRlbnRpZmllciwgQG1vZHVsZURlY2xhcmF0aW9uVHlwZVxuICAgICAgICBjb2RlID0gW11cbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBAb3JpZ2luYWwudmFsdWVcbiAgICAgICAgY29kZS5wdXNoIEBtYWtlQ29kZSBcIiBhcyAje0BhbGlhcy52YWx1ZX1cIiBpZiBAYWxpYXM/XG4gICAgICAgIGNvZGVcblxuZXhwb3J0cy5JbXBvcnRTcGVjaWZpZXIgPSBjbGFzcyBJbXBvcnRTcGVjaWZpZXIgZXh0ZW5kcyBNb2R1bGVTcGVjaWZpZXJcbiAgICBjb25zdHJ1Y3RvcjogKGltcG9ydGVkLCBsb2NhbCkgLT5cbiAgICAgICAgc3VwZXIgaW1wb3J0ZWQsIGxvY2FsLCAnaW1wb3J0J1xuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICAjIFBlciB0aGUgc3BlYywgc3ltYm9scyBjYW7igJl0IGJlIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzXG4gICAgICAgICMgKGUuZy4gYGltcG9ydCB7IGZvbywgZm9vIH0gZnJvbSAnbGliJ2AgaXMgaW52YWxpZClcbiAgICAgICAgaWYgQGlkZW50aWZpZXIgaW4gby5pbXBvcnRlZFN5bWJvbHMgb3Igby5zY29wZS5jaGVjayhAaWRlbnRpZmllcilcbiAgICAgICAgICAgIEBlcnJvciBcIicje0BpZGVudGlmaWVyfScgaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG8uaW1wb3J0ZWRTeW1ib2xzLnB1c2ggQGlkZW50aWZpZXJcbiAgICAgICAgc3VwZXIgb1xuXG5leHBvcnRzLkltcG9ydERlZmF1bHRTcGVjaWZpZXIgPSBjbGFzcyBJbXBvcnREZWZhdWx0U3BlY2lmaWVyIGV4dGVuZHMgSW1wb3J0U3BlY2lmaWVyXG5cbmV4cG9ydHMuSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyID0gY2xhc3MgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyIGV4dGVuZHMgSW1wb3J0U3BlY2lmaWVyXG5cbmV4cG9ydHMuRXhwb3J0U3BlY2lmaWVyID0gY2xhc3MgRXhwb3J0U3BlY2lmaWVyIGV4dGVuZHMgTW9kdWxlU3BlY2lmaWVyXG4gICAgY29uc3RydWN0b3I6IChsb2NhbCwgZXhwb3J0ZWQpIC0+XG4gICAgICAgIHN1cGVyIGxvY2FsLCBleHBvcnRlZCwgJ2V4cG9ydCdcblxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwMCAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcblxuIyBUaGUgKipBc3NpZ24qKiBpcyB1c2VkIHRvIGFzc2lnbiBhIGxvY2FsIHZhcmlhYmxlIHRvIHZhbHVlLCBvciB0byBzZXQgdGhlXG4jIHByb3BlcnR5IG9mIGFuIG9iamVjdCAtLSBpbmNsdWRpbmcgd2l0aGluIG9iamVjdCBsaXRlcmFscy5cblxuZXhwb3J0cy5Bc3NpZ24gPSBjbGFzcyBBc3NpZ24gZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAdmFyaWFibGUsIEB2YWx1ZSwgQGNvbnRleHQsIG9wdGlvbnMgPSB7fSkgLT5cbiAgICAgICAge0BwYXJhbSwgQHN1YnBhdHRlcm4sIEBvcGVyYXRvclRva2VuLCBAbW9kdWxlRGVjbGFyYXRpb259ID0gb3B0aW9uc1xuXG4gICAgY2hpbGRyZW46IFsndmFyaWFibGUnLCAndmFsdWUnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAtPlxuICAgICAgICBvPy5sZXZlbCBpcyBMRVZFTF9UT1AgYW5kIEBjb250ZXh0PyBhbmQgKEBtb2R1bGVEZWNsYXJhdGlvbiBvciBcIj9cIiBpbiBAY29udGV4dClcblxuICAgIGNoZWNrQXNzaWduYWJpbGl0eTogKG8sIHZhckJhc2UpIC0+XG4gICAgICAgIGlmIE9iamVjdDo6aGFzT3duUHJvcGVydHkuY2FsbChvLnNjb3BlLnBvc2l0aW9ucywgdmFyQmFzZS52YWx1ZSkgYW5kXG4gICAgICAgICAgICAgby5zY29wZS52YXJpYWJsZXNbby5zY29wZS5wb3NpdGlvbnNbdmFyQmFzZS52YWx1ZV1dLnR5cGUgaXMgJ2ltcG9ydCdcbiAgICAgICAgICAgIHZhckJhc2UuZXJyb3IgXCInI3t2YXJCYXNlLnZhbHVlfScgaXMgcmVhZC1vbmx5XCJcblxuICAgIGFzc2lnbnM6IChuYW1lKSAtPlxuICAgICAgICBAW2lmIEBjb250ZXh0IGlzICdvYmplY3QnIHRoZW4gJ3ZhbHVlJyBlbHNlICd2YXJpYWJsZSddLmFzc2lnbnMgbmFtZVxuXG4gICAgdW5mb2xkU29hazogKG8pIC0+XG4gICAgICAgIHVuZm9sZFNvYWsgbywgdGhpcywgJ3ZhcmlhYmxlJ1xuXG4gICAgIyBDb21waWxlIGFuIGFzc2lnbm1lbnQsIGRlbGVnYXRpbmcgdG8gYGNvbXBpbGVQYXR0ZXJuTWF0Y2hgIG9yXG4gICAgIyBgY29tcGlsZVNwbGljZWAgaWYgYXBwcm9wcmlhdGUuIEtlZXAgdHJhY2sgb2YgdGhlIG5hbWUgb2YgdGhlIGJhc2Ugb2JqZWN0XG4gICAgIyB3ZSd2ZSBiZWVuIGFzc2lnbmVkIHRvLCBmb3IgY29ycmVjdCBpbnRlcm5hbCByZWZlcmVuY2VzLiBJZiB0aGUgdmFyaWFibGVcbiAgICAjIGhhcyBub3QgYmVlbiBzZWVuIHlldCB3aXRoaW4gdGhlIGN1cnJlbnQgc2NvcGUsIGRlY2xhcmUgaXQuXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgaXNWYWx1ZSA9IEB2YXJpYWJsZSBpbnN0YW5jZW9mIFZhbHVlXG4gICAgICAgICAgICByZXR1cm4gQGNvbXBpbGVQYXR0ZXJuTWF0Y2ggbyBpZiBAdmFyaWFibGUuaXNBcnJheSgpIG9yIEB2YXJpYWJsZS5pc09iamVjdCgpXG4gICAgICAgICAgICByZXR1cm4gQGNvbXBpbGVTcGxpY2UgICAgICAgbyBpZiBAdmFyaWFibGUuaXNTcGxpY2UoKVxuICAgICAgICAgICAgcmV0dXJuIEBjb21waWxlQ29uZGl0aW9uYWwgIG8gaWYgQGNvbnRleHQgaW4gWyd8fD0nLCAnJiY9JywgJz89J11cbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZVNwZWNpYWxNYXRoICBvIGlmIEBjb250ZXh0IGluIFsnKio9JywgJy8vPScsICclJT0nXVxuICAgICAgICBpZiBAdmFsdWUgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICBpZiBAdmFsdWUuc3RhdGljXG4gICAgICAgICAgICAgICAgQHZhbHVlLmtsYXNzID0gQHZhcmlhYmxlLmJhc2VcbiAgICAgICAgICAgICAgICBAdmFsdWUubmFtZSAgPSBAdmFyaWFibGUucHJvcGVydGllc1swXVxuICAgICAgICAgICAgICAgIEB2YWx1ZS52YXJpYWJsZSA9IEB2YXJpYWJsZVxuICAgICAgICAgICAgZWxzZSBpZiBAdmFyaWFibGUucHJvcGVydGllcz8ubGVuZ3RoID49IDJcbiAgICAgICAgICAgICAgICBbcHJvcGVydGllcy4uLiwgcHJvdG90eXBlLCBuYW1lXSA9IEB2YXJpYWJsZS5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgaWYgcHJvdG90eXBlLm5hbWU/LnZhbHVlIGlzICdwcm90b3R5cGUnXG4gICAgICAgICAgICAgICAgICAgIEB2YWx1ZS5rbGFzcyA9IG5ldyBWYWx1ZSBAdmFyaWFibGUuYmFzZSwgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgICAgICBAdmFsdWUubmFtZSAgPSBuYW1lXG4gICAgICAgICAgICAgICAgICAgIEB2YWx1ZS52YXJpYWJsZSA9IEB2YXJpYWJsZVxuICAgICAgICB1bmxlc3MgQGNvbnRleHRcbiAgICAgICAgICAgIHZhckJhc2UgPSBAdmFyaWFibGUudW53cmFwQWxsKClcbiAgICAgICAgICAgIHVubGVzcyB2YXJCYXNlLmlzQXNzaWduYWJsZSgpXG4gICAgICAgICAgICAgICAgQHZhcmlhYmxlLmVycm9yIFwiJyN7QHZhcmlhYmxlLmNvbXBpbGUgb30nIGNhbid0IGJlIGFzc2lnbmVkXCJcbiAgICAgICAgICAgIHVubGVzcyB2YXJCYXNlLmhhc1Byb3BlcnRpZXM/KClcbiAgICAgICAgICAgICAgICAjIGBtb2R1bGVEZWNsYXJhdGlvbmAgY2FuIGJlIGAnaW1wb3J0J2Agb3IgYCdleHBvcnQnYFxuICAgICAgICAgICAgICAgIGlmIEBtb2R1bGVEZWNsYXJhdGlvblxuICAgICAgICAgICAgICAgICAgICBAY2hlY2tBc3NpZ25hYmlsaXR5IG8sIHZhckJhc2VcbiAgICAgICAgICAgICAgICAgICAgby5zY29wZS5hZGQgdmFyQmFzZS52YWx1ZSwgQG1vZHVsZURlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBAcGFyYW1cbiAgICAgICAgICAgICAgICAgICAgby5zY29wZS5hZGQgdmFyQmFzZS52YWx1ZSwgJ3ZhcidcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBjaGVja0Fzc2lnbmFiaWxpdHkgbywgdmFyQmFzZVxuICAgICAgICAgICAgICAgICAgICBvLnNjb3BlLmZpbmQgdmFyQmFzZS52YWx1ZVxuXG4gICAgICAgIHZhbCA9IEB2YWx1ZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuICAgICAgICBAdmFyaWFibGUuZnJvbnQgPSB0cnVlIGlmIGlzVmFsdWUgYW5kIEB2YXJpYWJsZS5iYXNlIGluc3RhbmNlb2YgT2JqXG4gICAgICAgIGNvbXBpbGVkTmFtZSA9IEB2YXJpYWJsZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVFxuXG4gICAgICAgIGlmIEBjb250ZXh0IGlzICdvYmplY3QnXG4gICAgICAgICAgICBpZiBmcmFnbWVudHNUb1RleHQoY29tcGlsZWROYW1lKSBpbiBKU19GT1JCSURERU5cbiAgICAgICAgICAgICAgICBjb21waWxlZE5hbWUudW5zaGlmdCBAbWFrZUNvZGUgJ1wiJ1xuICAgICAgICAgICAgICAgIGNvbXBpbGVkTmFtZS5wdXNoIEBtYWtlQ29kZSAnXCInXG4gICAgICAgICAgICByZXR1cm4gY29tcGlsZWROYW1lLmNvbmNhdCBAbWFrZUNvZGUoXCI6IFwiKSwgdmFsXG5cbiAgICAgICAgYW5zd2VyID0gY29tcGlsZWROYW1lLmNvbmNhdCBAbWFrZUNvZGUoXCIgI3sgQGNvbnRleHQgb3IgJz0nIH0gXCIpLCB2YWxcbiAgICAgICAgaWYgby5sZXZlbCA8PSBMRVZFTF9MSVNUIHRoZW4gYW5zd2VyIGVsc2UgQHdyYXBJbkJyYWNlcyBhbnN3ZXJcblxuICAgICMgQnJpZWYgaW1wbGVtZW50YXRpb24gb2YgcmVjdXJzaXZlIHBhdHRlcm4gbWF0Y2hpbmcsIHdoZW4gYXNzaWduaW5nIGFycmF5IG9yXG4gICAgIyBvYmplY3QgbGl0ZXJhbHMgdG8gYSB2YWx1ZS4gUGVla3MgYXQgdGhlaXIgcHJvcGVydGllcyB0byBhc3NpZ24gaW5uZXIgbmFtZXMuXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY29tcGlsZVBhdHRlcm5NYXRjaDogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICB0b3AgICAgICAgPSBvLmxldmVsIGlzIExFVkVMX1RPUFxuICAgICAgICB7dmFsdWV9ICAgPSB0aGlzXG4gICAgICAgIHtvYmplY3RzfSA9IEB2YXJpYWJsZS5iYXNlXG4gICAgICAgIFxuICAgICAgICB1bmxlc3Mgb2xlbiA9IG9iamVjdHMubGVuZ3RoXG4gICAgICAgICAgICBjb2RlID0gdmFsdWUuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgICAgIHJldHVybiBpZiBvLmxldmVsID49IExFVkVMX09QIHRoZW4gQHdyYXBJbkJyYWNlcyBjb2RlIGVsc2UgY29kZVxuICAgICAgICAgICAgXG4gICAgICAgIFtvYmpdID0gb2JqZWN0c1xuICAgICAgICBcbiAgICAgICAgaWYgb2xlbiBpcyAxIGFuZCBvYmogaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgIG9iai5lcnJvciAnRGVzdHJ1Y3R1cmluZyBhc3NpZ25tZW50IGhhcyBubyB0YXJnZXQnXG4gICAgICAgICAgICBcbiAgICAgICAgaXNPYmplY3QgPSBAdmFyaWFibGUuaXNPYmplY3QoKVxuICAgICAgICBcbiAgICAgICAgaWYgdG9wIGFuZCBvbGVuIGlzIDEgYW5kIG9iaiBub3QgaW5zdGFuY2VvZiBTcGxhdFxuICAgICAgICAgICAgIyBQaWNrIHRoZSBwcm9wZXJ0eSBzdHJhaWdodCBvZmYgdGhlIHZhbHVlIHdoZW4gdGhlcmXigJlzIGp1c3Qgb25lIHRvIHBpY2tcbiAgICAgICAgICAgICMgKG5vIG5lZWQgdG8gY2FjaGUgdGhlIHZhbHVlIGludG8gYSB2YXJpYWJsZSkuXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBudWxsXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG9iai5jb250ZXh0IGlzICdvYmplY3QnXG4gICAgICAgICAgICAgICAgIyBBIHJlZ3VsYXIgb2JqZWN0IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAge3ZhcmlhYmxlOiB7YmFzZTogaWR4fSwgdmFsdWU6IG9ian0gPSBvYmpcbiAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ25cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gb2JqLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YXJpYWJsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUgPSBvYmoudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhcmlhYmxlXG4gICAgICAgICAgICAgICAgaWR4ID0gaWYgaXNPYmplY3QgIyBBIHNob3J0aGFuZCBge2EsIGIsIEBjfSA9IHZhbGAgcGF0dGVybi1tYXRjaC5cbiAgICAgICAgICAgICAgICAgICAgaWYgb2JqLnRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5wcm9wZXJ0aWVzWzBdLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFByb3BlcnR5TmFtZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICMgQSByZWd1bGFyIGFycmF5IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIG5ldyBOdW1iZXJMaXRlcmFsIDBcbiAgICAgICAgICAgIGFjYyA9IGlkeC51bndyYXAoKSBpbnN0YW5jZW9mIFByb3BlcnR5TmFtZVxuICAgICAgICAgICAgdmFsdWUgPSBuZXcgVmFsdWUgdmFsdWVcbiAgICAgICAgICAgIHZhbHVlLnByb3BlcnRpZXMucHVzaCBuZXcgKGlmIGFjYyB0aGVuIEFjY2VzcyBlbHNlIEluZGV4KSBpZHhcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgIG9iai5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgICAgIHZhbHVlID0gbmV3IE9wICc/JywgdmFsdWUsIGRlZmF1bHRWYWx1ZSBpZiBkZWZhdWx0VmFsdWVcbiAgICAgICAgICAgIHJldHVybiBuZXcgQXNzaWduKG9iaiwgdmFsdWUsIG51bGwsIHBhcmFtOiBAcGFyYW0pLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcbiAgICAgICAgICAgIFxuICAgICAgICB2dmFyICAgICA9IHZhbHVlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgIHZ2YXJUZXh0ID0gZnJhZ21lbnRzVG9UZXh0IHZ2YXJcbiAgICAgICAgYXNzaWducyAgPSBbXVxuICAgICAgICBleHBhbmRlZElkeCA9IGZhbHNlXG4gICAgICAgICMgTWFrZSB2dmFyIGludG8gYSBzaW1wbGUgdmFyaWFibGUgaWYgaXQgaXNuJ3QgYWxyZWFkeS5cbiAgICAgICAgaWYgdmFsdWUudW53cmFwKCkgbm90IGluc3RhbmNlb2YgSWRlbnRpZmllckxpdGVyYWwgb3IgQHZhcmlhYmxlLmFzc2lnbnModnZhclRleHQpXG4gICAgICAgICAgICBhc3NpZ25zLnB1c2ggW0BtYWtlQ29kZShcIiN7IHJlZiA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnIH0gPSBcIiksIHZ2YXIuLi5dXG4gICAgICAgICAgICB2dmFyID0gW0BtYWtlQ29kZSByZWZdXG4gICAgICAgICAgICB2dmFyVGV4dCA9IHJlZlxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBvYmosIGkgaW4gb2JqZWN0c1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZHggPSBpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCBleHBhbmRlZElkeCBhbmQgb2JqIGluc3RhbmNlb2YgU3BsYXRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gb2JqLm5hbWUudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgICAgICBvYmogPSBvYmoudW53cmFwKClcbiAgICAgICAgICAgICAgICB2YWwgPSBcIiN7b2xlbn0gPD0gI3t2dmFyVGV4dH0ubGVuZ3RoID8gI3sgdXRpbGl0eSAnc2xpY2UnLCBvIH0uY2FsbCgje3Z2YXJUZXh0fSwgI3tpfVwiXG4gICAgICAgICAgICAgICAgaWYgcmVzdCA9IG9sZW4gLSBpIC0gMVxuICAgICAgICAgICAgICAgICAgICBpdmFyID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2knLCBzaW5nbGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgdmFsICs9IFwiLCAje2l2YXJ9ID0gI3t2dmFyVGV4dH0ubGVuZ3RoIC0gI3tyZXN0fSkgOiAoI3tpdmFyfSA9ICN7aX0sIFtdKVwiXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB2YWwgKz0gXCIpIDogW11cIlxuICAgICAgICAgICAgICAgIHZhbCAgICAgPSBuZXcgTGl0ZXJhbCB2YWxcbiAgICAgICAgICAgICAgICBleHBhbmRlZElkeCA9IFwiI3tpdmFyfSsrXCJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgbm90IGV4cGFuZGVkSWR4IGFuZCBvYmogaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiByZXN0ID0gb2xlbiAtIGkgLSAxXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlc3QgaXMgMVxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwYW5kZWRJZHggPSBcIiN7dnZhclRleHR9Lmxlbmd0aCAtIDFcIlxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpdmFyID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2knLCBzaW5nbGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBMaXRlcmFsIFwiI3tpdmFyfSA9ICN7dnZhclRleHR9Lmxlbmd0aCAtICN7cmVzdH1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwYW5kZWRJZHggPSBcIiN7aXZhcn0rK1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ25zLnB1c2ggdmFsLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBTcGxhdCBvciBvYmogaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgICAgICAgICAgb2JqLmVycm9yIFwibXVsdGlwbGUgc3BsYXRzL2V4cGFuc2lvbnMgYXJlIGRpc2FsbG93ZWQgaW4gYW4gYXNzaWdubWVudFwiXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gbnVsbFxuICAgICAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnbiBhbmQgb2JqLmNvbnRleHQgaXMgJ29iamVjdCcgIyBBIHJlZ3VsYXIgb2JqZWN0IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIHt2YXJpYWJsZToge2Jhc2U6IGlkeH0sIHZhbHVlOiBvYmp9ID0gb2JqXG4gICAgICAgICAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gb2JqLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSBvYmoudmFyaWFibGVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIG9iaiBpbnN0YW5jZW9mIEFzc2lnblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlID0gb2JqLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmogPSBvYmoudmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gaWYgaXNPYmplY3QgIyBBIHNob3J0aGFuZCBge2EsIGIsIEBjfSA9IHZhbGAgcGF0dGVybi1tYXRjaC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9iai50aGlzIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iai5wcm9wZXJ0aWVzWzBdLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgUHJvcGVydHlOYW1lIG9iai51bndyYXAoKS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbHNlICMgQSByZWd1bGFyIGFycmF5IHBhdHRlcm4tbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgTGl0ZXJhbCBleHBhbmRlZElkeCBvciBpZHhcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hbWUgPSBvYmoudW53cmFwKCkudmFsdWVcbiAgICAgICAgICAgICAgICBhY2MgPSBpZHgudW53cmFwKCkgaW5zdGFuY2VvZiBQcm9wZXJ0eU5hbWVcbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgVmFsdWUgbmV3IExpdGVyYWwodnZhclRleHQpLCBbbmV3IChpZiBhY2MgdGhlbiBBY2Nlc3MgZWxzZSBJbmRleCkgaWR4XVxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBPcCAnPycsIHZhbCwgZGVmYXVsdFZhbHVlIGlmIGRlZmF1bHRWYWx1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbmFtZT9cbiAgICAgICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgbmFtZVxuICAgICAgICAgICAgICAgIG9iai5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXNzaWducy5wdXNoIG5ldyBBc3NpZ24ob2JqLCB2YWwsIG51bGwsIHBhcmFtOiBAcGFyYW0sIHN1YnBhdHRlcm46IHllcykuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1RcbiAgICAgICAgICAgIFxuICAgICAgICBhc3NpZ25zLnB1c2ggdnZhciB1bmxlc3MgdG9wIG9yIEBzdWJwYXR0ZXJuXG4gICAgICAgIGZyYWdtZW50cyA9IEBqb2luRnJhZ21lbnRBcnJheXMgYXNzaWducywgJywgJ1xuICAgICAgICBpZiBvLmxldmVsIDwgTEVWRUxfTElTVCB0aGVuIGZyYWdtZW50cyBlbHNlIEB3cmFwSW5CcmFjZXMgZnJhZ21lbnRzXG5cbiAgICAjIFdoZW4gY29tcGlsaW5nIGEgY29uZGl0aW9uYWwgYXNzaWdubWVudCwgdGFrZSBjYXJlIHRvIGVuc3VyZSB0aGF0IHRoZVxuICAgICMgb3BlcmFuZHMgYXJlIG9ubHkgZXZhbHVhdGVkIG9uY2UsIGV2ZW4gdGhvdWdoIHdlIGhhdmUgdG8gcmVmZXJlbmNlIHRoZW0gbW9yZSB0aGFuIG9uY2UuXG4gICAgXG4gICAgY29tcGlsZUNvbmRpdGlvbmFsOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIFtsZWZ0LCByaWdodF0gPSBAdmFyaWFibGUuY2FjaGVSZWZlcmVuY2Ugb1xuICAgICAgICAjIERpc2FsbG93IGNvbmRpdGlvbmFsIGFzc2lnbm1lbnQgb2YgdW5kZWZpbmVkIHZhcmlhYmxlcy5cbiAgICAgICAgaWYgbm90IGxlZnQucHJvcGVydGllcy5sZW5ndGggYW5kIGxlZnQuYmFzZSBpbnN0YW5jZW9mIExpdGVyYWwgYW5kXG4gICAgICAgICAgICAgICAgICAgICBsZWZ0LmJhc2Ugbm90IGluc3RhbmNlb2YgVGhpc0xpdGVyYWwgYW5kIG5vdCBvLnNjb3BlLmNoZWNrIGxlZnQuYmFzZS52YWx1ZVxuICAgICAgICAgICAgQHZhcmlhYmxlLmVycm9yIFwidGhlIHZhcmlhYmxlIFxcXCIje2xlZnQuYmFzZS52YWx1ZX1cXFwiIGNhbid0IGJlIGFzc2lnbmVkIHdpdGggI3tAY29udGV4dH0gYmVjYXVzZSBpdCBoYXMgbm90IGJlZW4gZGVjbGFyZWQgYmVmb3JlXCJcbiAgICAgICAgaWYgXCI/XCIgaW4gQGNvbnRleHRcbiAgICAgICAgICAgIG8uaXNFeGlzdGVudGlhbEVxdWFscyA9IHRydWVcbiAgICAgICAgICAgIG5ldyBJZihuZXcgRXhpc3RlbmNlKGxlZnQpLCByaWdodCwgdHlwZTogJ2lmJykuYWRkRWxzZShuZXcgQXNzaWduKHJpZ2h0LCBAdmFsdWUsICc9JykpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyYWdtZW50cyA9IG5ldyBPcChAY29udGV4dFsuLi4tMV0sIGxlZnQsIG5ldyBBc3NpZ24ocmlnaHQsIEB2YWx1ZSwgJz0nKSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cbiAgICAgICAgICAgIGlmIG8ubGV2ZWwgPD0gTEVWRUxfTElTVCB0aGVuIGZyYWdtZW50cyBlbHNlIEB3cmFwSW5CcmFjZXMgZnJhZ21lbnRzXG5cbiAgICAjIENvbnZlcnQgc3BlY2lhbCBtYXRoIGFzc2lnbm1lbnQgb3BlcmF0b3JzIGxpa2UgYGEgKio9IGJgIHRvIHRoZSBlcXVpdmFsZW50XG4gICAgIyBleHRlbmRlZCBmb3JtIGBhID0gYSAqKiBiYCBhbmQgdGhlbiBjb21waWxlcyB0aGF0LlxuICAgIFxuICAgIGNvbXBpbGVTcGVjaWFsTWF0aDogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICBbbGVmdCwgcmlnaHRdID0gQHZhcmlhYmxlLmNhY2hlUmVmZXJlbmNlIG9cbiAgICAgICAgbmV3IEFzc2lnbihsZWZ0LCBuZXcgT3AoQGNvbnRleHRbLi4uLTFdLCByaWdodCwgQHZhbHVlKSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgICMgQ29tcGlsZSB0aGUgYXNzaWdubWVudCBmcm9tIGFuIGFycmF5IHNwbGljZSBsaXRlcmFsLCB1c2luZyBKYXZhU2NyaXB0J3MgYEFycmF5I3NwbGljZWAgbWV0aG9kLlxuICAgIFxuICAgIGNvbXBpbGVTcGxpY2U6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAge3JhbmdlOiB7ZnJvbSwgdG8sIGV4Y2x1c2l2ZX19ID0gQHZhcmlhYmxlLnByb3BlcnRpZXMucG9wKClcbiAgICAgICAgbmFtZSA9IEB2YXJpYWJsZS5jb21waWxlIG9cbiAgICAgICAgaWYgZnJvbVxuICAgICAgICAgICAgW2Zyb21EZWNsLCBmcm9tUmVmXSA9IEBjYWNoZVRvQ29kZUZyYWdtZW50cyBmcm9tLmNhY2hlIG8sIExFVkVMX09QXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZyb21EZWNsID0gZnJvbVJlZiA9ICcwJ1xuICAgICAgICBpZiB0b1xuICAgICAgICAgICAgaWYgZnJvbT8uaXNOdW1iZXIoKSBhbmQgdG8uaXNOdW1iZXIoKVxuICAgICAgICAgICAgICAgIHRvID0gdG8uY29tcGlsZShvKSAtIGZyb21SZWZcbiAgICAgICAgICAgICAgICB0byArPSAxIHVubGVzcyBleGNsdXNpdmVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0byA9IHRvLmNvbXBpbGUobywgTEVWRUxfQUNDRVNTKSArICcgLSAnICsgZnJvbVJlZlxuICAgICAgICAgICAgICAgIHRvICs9ICcgKyAxJyB1bmxlc3MgZXhjbHVzaXZlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRvID0gXCI5ZTlcIlxuICAgICAgICBbdmFsRGVmLCB2YWxSZWZdID0gQHZhbHVlLmNhY2hlIG8sIExFVkVMX0xJU1RcbiAgICAgICAgYW5zd2VyID0gW10uY29uY2F0IEBtYWtlQ29kZShcIltdLnNwbGljZS5hcHBseSgje25hbWV9LCBbI3tmcm9tRGVjbH0sICN7dG99XS5jb25jYXQoXCIpLCB2YWxEZWYsIEBtYWtlQ29kZShcIikpLCBcIiksIHZhbFJlZlxuICAgICAgICBpZiBvLmxldmVsID4gTEVWRUxfVE9QIHRoZW4gQHdyYXBJbkJyYWNlcyBhbnN3ZXIgZWxzZSBhbnN3ZXJcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgXG5cbiMgQSBmdW5jdGlvbiBkZWZpbml0aW9uLiBUaGlzIGlzIHRoZSBvbmx5IG5vZGUgdGhhdCBjcmVhdGVzIGEgbmV3IFNjb3BlLlxuIyBXaGVuIGZvciB0aGUgcHVycG9zZXMgb2Ygd2Fsa2luZyB0aGUgY29udGVudHMgb2YgYSBmdW5jdGlvbiBib2R5LCB0aGUgQ29kZVxuIyBoYXMgbm8gKmNoaWxkcmVuKiAtLSB0aGV5J3JlIHdpdGhpbiB0aGUgaW5uZXIgc2NvcGUuXG5cbmV4cG9ydHMuQ29kZSA9IGNsYXNzIENvZGUgZXh0ZW5kcyBCYXNlXG4gICAgY29uc3RydWN0b3I6IChwYXJhbXMsIGJvZHksIHRhZykgLT5cbiAgICAgICAgQHBhcmFtcyA9IHBhcmFtcyBvciBbXVxuICAgICAgICBAYm9keSAgID0gYm9keSBvciBuZXcgQmxvY2tcbiAgICAgICAgQGJvdW5kICA9IHRhZyBpcyAnYm91bmRmdW5jJ1xuICAgICAgICBAaXNHZW5lcmF0b3IgPSAhIUBib2R5LmNvbnRhaW5zIChub2RlKSAtPlxuICAgICAgICAgICAgKG5vZGUgaW5zdGFuY2VvZiBPcCBhbmQgbm9kZS5pc1lpZWxkKCkpIG9yIG5vZGUgaW5zdGFuY2VvZiBZaWVsZFJldHVyblxuXG4gICAgY2hpbGRyZW46IFsncGFyYW1zJywgJ2JvZHknXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IC0+ICEhQGN0b3JcblxuICAgIGp1bXBzOiBOT1xuXG4gICAgbWFrZVNjb3BlOiAocGFyZW50U2NvcGUpIC0+IG5ldyBTY29wZSBwYXJlbnRTY29wZSwgQGJvZHksIHRoaXNcblxuICAgICMgQ29tcGlsYXRpb24gY3JlYXRlcyBhIG5ldyBzY29wZSB1bmxlc3MgZXhwbGljaXRseSBhc2tlZCB0byBzaGFyZSB3aXRoIHRoZVxuICAgICMgb3V0ZXIgc2NvcGUuIEhhbmRsZXMgc3BsYXQgcGFyYW1ldGVycyBpbiB0aGUgcGFyYW1ldGVyIGxpc3QgYnkgcGVla2luZyBhdFxuICAgICMgdGhlIEphdmFTY3JpcHQgYGFyZ3VtZW50c2Agb2JqZWN0LiBJZiB0aGUgZnVuY3Rpb24gaXMgYm91bmQgd2l0aCB0aGUgYD0+YFxuICAgICMgYXJyb3csIGdlbmVyYXRlcyBhIHdyYXBwZXIgdGhhdCBzYXZlcyB0aGUgY3VycmVudCB2YWx1ZSBvZiBgdGhpc2AgdGhyb3VnaFxuICAgICMgYSBjbG9zdXJlLlxuICAgIFxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cblxuICAgICAgICBpZiBAYm91bmQgYW5kIG8uc2NvcGUubWV0aG9kPy5ib3VuZFxuICAgICAgICAgICAgQGNvbnRleHQgPSBvLnNjb3BlLm1ldGhvZC5jb250ZXh0XG5cbiAgICAgICAgaWYgQGJvdW5kIGFuZCBub3QgQGNvbnRleHQgIyBIYW5kbGUgYm91bmQgZnVuY3Rpb25zIGVhcmx5LlxuICAgICAgICAgICAgQGNvbnRleHQgPSAnX3RoaXMnXG4gICAgICAgICAgICB3cmFwcGVyID0gbmV3IENvZGUgW25ldyBQYXJhbSBuZXcgSWRlbnRpZmllckxpdGVyYWwgQGNvbnRleHRdLCBuZXcgQmxvY2sgW3RoaXNdXG4gICAgICAgICAgICBib3VuZGZ1bmMgPSBuZXcgQ2FsbCh3cmFwcGVyLCBbbmV3IFRoaXNMaXRlcmFsXSlcbiAgICAgICAgICAgIGJvdW5kZnVuYy51cGRhdGVMb2NhdGlvbkRhdGFJZk1pc3NpbmcgQGxvY2F0aW9uRGF0YVxuICAgICAgICAgICAgcmV0dXJuIGJvdW5kZnVuYy5jb21waWxlTm9kZShvKVxuXG4gICAgICAgIG8uc2NvcGUgICAgICAgICA9IGRlbChvLCAnY2xhc3NTY29wZScpIG9yIEBtYWtlU2NvcGUgby5zY29wZVxuICAgICAgICBvLnNjb3BlLnNoYXJlZCAgPSBkZWwobywgJ3NoYXJlZFNjb3BlJylcbiAgICAgICAgby5pbmRlbnQgICAgICAgKz0gVEFCXG4gICAgICAgIGRlbGV0ZSBvLmJhcmVcbiAgICAgICAgZGVsZXRlIG8uaXNFeGlzdGVudGlhbEVxdWFsc1xuICAgICAgICBwYXJhbXMgPSBbXVxuICAgICAgICBleHBycyAgPSBbXVxuICAgICAgICBmb3IgcGFyYW0gaW4gQHBhcmFtcyB3aGVuIHBhcmFtIG5vdCBpbnN0YW5jZW9mIEV4cGFuc2lvblxuICAgICAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgcGFyYW0uYXNSZWZlcmVuY2Ugb1xuICAgICAgICBmb3IgcGFyYW0gaW4gQHBhcmFtcyB3aGVuIHBhcmFtLnNwbGF0IG9yIHBhcmFtIGluc3RhbmNlb2YgRXhwYW5zaW9uXG4gICAgICAgICAgICBmb3IgcCBpbiBAcGFyYW1zIHdoZW4gcCBub3QgaW5zdGFuY2VvZiBFeHBhbnNpb24gYW5kIHAubmFtZS52YWx1ZVxuICAgICAgICAgICAgICAgIG8uc2NvcGUuYWRkIHAubmFtZS52YWx1ZSwgJ3ZhcicsIHllc1xuICAgICAgICAgICAgc3BsYXRzID0gbmV3IEFzc2lnbiBuZXcgVmFsdWUobmV3IEFycihwLmFzUmVmZXJlbmNlIG8gZm9yIHAgaW4gQHBhcmFtcykpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwgJ2FyZ3VtZW50cydcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGZvciBwYXJhbSBpbiBAcGFyYW1zXG4gICAgICAgICAgICBpZiBwYXJhbS5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgICAgIHZhbCA9IHJlZiA9IHBhcmFtLmFzUmVmZXJlbmNlIG9cbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgT3AgJz8nLCByZWYsIHBhcmFtLnZhbHVlIGlmIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICAgICAgZXhwcnMucHVzaCBuZXcgQXNzaWduIG5ldyBWYWx1ZShwYXJhbS5uYW1lKSwgdmFsLCAnPScsIHBhcmFtOiB5ZXNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZWYgPSBwYXJhbVxuICAgICAgICAgICAgICAgIGlmIHBhcmFtLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGxpdCA9IG5ldyBMaXRlcmFsIHJlZi5uYW1lLnZhbHVlICsgJyA9PSBudWxsJ1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSBuZXcgQXNzaWduIG5ldyBWYWx1ZShwYXJhbS5uYW1lKSwgcGFyYW0udmFsdWUsICc9J1xuICAgICAgICAgICAgICAgICAgICBleHBycy5wdXNoIG5ldyBJZiBsaXQsIHZhbFxuICAgICAgICAgICAgcGFyYW1zLnB1c2ggcmVmIHVubGVzcyBzcGxhdHNcbiAgICAgICAgd2FzRW1wdHkgPSBAYm9keS5pc0VtcHR5KClcbiAgICAgICAgZXhwcnMudW5zaGlmdCBzcGxhdHMgaWYgc3BsYXRzXG4gICAgICAgIEBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgZXhwcnMuLi4gaWYgZXhwcnMubGVuZ3RoXG4gICAgICAgIGZvciBwLCBpIGluIHBhcmFtc1xuICAgICAgICAgICAgcGFyYW1zW2ldID0gcC5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICAgICAgby5zY29wZS5wYXJhbWV0ZXIgZnJhZ21lbnRzVG9UZXh0IHBhcmFtc1tpXVxuICAgICAgICB1bmlxcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBAZWFjaFBhcmFtTmFtZSAobmFtZSwgbm9kZSkgLT5cbiAgICAgICAgICAgIG5vZGUuZXJyb3IgXCJtdWx0aXBsZSBwYXJhbWV0ZXJzIG5hbWVkICN7bmFtZX1cIiBpZiBuYW1lIGluIHVuaXFzXG4gICAgICAgICAgICB1bmlxcy5wdXNoIG5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICBAYm9keS5tYWtlUmV0dXJuKCkgdW5sZXNzIHdhc0VtcHR5IG9yIEBub1JldHVyblxuICAgICAgICBjb2RlID0gJ2Z1bmN0aW9uJ1xuICAgICAgICBjb2RlICs9ICcqJyBpZiBAaXNHZW5lcmF0b3JcbiAgICAgICAgY29kZSArPSAnICcgKyBAbmFtZSBpZiBAY3RvclxuICAgICAgICBjb2RlICs9ICcoJ1xuICAgICAgICBcbiAgICAgICAgYW5zd2VyID0gW0BtYWtlQ29kZShjb2RlKV1cbiAgICAgICAgXG4gICAgICAgIGZvciBwLCBpIGluIHBhcmFtc1xuICAgICAgICAgICAgaWYgaSB0aGVuIGFuc3dlci5wdXNoIEBtYWtlQ29kZSBcIiwgXCJcbiAgICAgICAgICAgIGFuc3dlci5wdXNoIHAuLi5cbiAgICAgICAgYW5zd2VyLnB1c2ggQG1ha2VDb2RlICcpIHsnXG4gICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQoQG1ha2VDb2RlKFwiXFxuXCIpLCBAYm9keS5jb21waWxlV2l0aERlY2xhcmF0aW9ucyhvKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifVwiKSkgdW5sZXNzIEBib2R5LmlzRW1wdHkoKVxuICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgJ30nXG5cbiAgICAgICAgcmV0dXJuIFtAbWFrZUNvZGUoQHRhYiksIGFuc3dlci4uLl0gaWYgQGN0b3JcbiAgICAgICAgaWYgQGZyb250IG9yIChvLmxldmVsID49IExFVkVMX0FDQ0VTUykgdGhlbiBAd3JhcEluQnJhY2VzIGFuc3dlciBlbHNlIGFuc3dlclxuXG4gICAgZWFjaFBhcmFtTmFtZTogKGl0ZXJhdG9yKSAtPlxuICAgICAgICBwYXJhbS5lYWNoTmFtZSBpdGVyYXRvciBmb3IgcGFyYW0gaW4gQHBhcmFtc1xuXG4gICAgIyBTaG9ydC1jaXJjdWl0IGB0cmF2ZXJzZUNoaWxkcmVuYCBtZXRob2QgdG8gcHJldmVudCBpdCBmcm9tIGNyb3NzaW5nIHNjb3BlIGJvdW5kYXJpZXNcbiAgICAjIHVubGVzcyBgY3Jvc3NTY29wZWAgaXMgYHRydWVgLlxuICAgIFxuICAgIHRyYXZlcnNlQ2hpbGRyZW46IChjcm9zc1Njb3BlLCBmdW5jKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXIoY3Jvc3NTY29wZSwgZnVuYykgaWYgY3Jvc3NTY29wZVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuXG4jIEEgcGFyYW1ldGVyIGluIGEgZnVuY3Rpb24gZGVmaW5pdGlvbi4gQmV5b25kIGEgdHlwaWNhbCBKYXZhU2NyaXB0IHBhcmFtZXRlcixcbiMgdGhlc2UgcGFyYW1ldGVycyBjYW4gYWxzbyBhdHRhY2ggdGhlbXNlbHZlcyB0byB0aGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24sXG4jIGFzIHdlbGwgYXMgYmUgYSBzcGxhdCwgZ2F0aGVyaW5nIHVwIGEgZ3JvdXAgb2YgcGFyYW1ldGVycyBpbnRvIGFuIGFycmF5LlxuXG5leHBvcnRzLlBhcmFtID0gY2xhc3MgUGFyYW0gZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAbmFtZSwgQHZhbHVlLCBAc3BsYXQpIC0+XG4gICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBAbmFtZS51bndyYXBBbGwoKS52YWx1ZVxuICAgICAgICBAbmFtZS5lcnJvciBtZXNzYWdlIGlmIG1lc3NhZ2VcbiAgICAgICAgIyB0aGUgZm9sbG93aW5nIGVycm9yIGRvZW5zJ3QgdGhyb3cgYW55bW9yZSBpbiBrb2ZmZWUgKGNvbmZpZyBwYXJhbWV0ZXJzKVxuICAgICAgICAjIGlmIEBuYW1lIGluc3RhbmNlb2YgT2JqIGFuZCBAbmFtZS5nZW5lcmF0ZWRcbiAgICAgICAgICAgICMgdG9rZW4gPSBAbmFtZS5vYmplY3RzWzBdLm9wZXJhdG9yVG9rZW5cbiAgICAgICAgICAgICMgdG9rZW4uZXJyb3IgXCJ1bmV4cGVjdGVkICN7dG9rZW4udmFsdWV9XCJcblxuICAgIGNoaWxkcmVuOiBbJ25hbWUnLCAndmFsdWUnXVxuXG4gICAgY29tcGlsZVRvRnJhZ21lbnRzOiAobykgLT5cbiAgICAgICAgXG4gICAgICAgIEBuYW1lLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG5cbiAgICBhc1JlZmVyZW5jZTogKG8pIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQHJlZmVyZW5jZSBpZiBAcmVmZXJlbmNlXG4gICAgICAgIG5vZGUgPSBAbmFtZVxuICAgICAgICBpZiBub2RlLnRoaXNcbiAgICAgICAgICAgIG5hbWUgPSBub2RlLnByb3BlcnRpZXNbMF0ubmFtZS52YWx1ZVxuICAgICAgICAgICAgbmFtZSA9IFwiXyN7bmFtZX1cIiBpZiBuYW1lIGluIEpTX0ZPUkJJRERFTlxuICAgICAgICAgICAgbm9kZSA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSBuYW1lXG4gICAgICAgIGVsc2UgaWYgbm9kZS5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgbm9kZSA9IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCBvLnNjb3BlLmZyZWVWYXJpYWJsZSAnYXJnJ1xuICAgICAgICBub2RlID0gbmV3IFZhbHVlIG5vZGVcbiAgICAgICAgbm9kZSA9IG5ldyBTcGxhdCBub2RlIGlmIEBzcGxhdFxuICAgICAgICBub2RlLnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBAbG9jYXRpb25EYXRhXG4gICAgICAgIEByZWZlcmVuY2UgPSBub2RlXG5cbiAgICBpc0NvbXBsZXg6IC0+XG4gICAgICAgIFxuICAgICAgICBAbmFtZS5pc0NvbXBsZXgoKVxuXG4gICAgIyBJdGVyYXRlcyB0aGUgbmFtZSBvciBuYW1lcyBvZiBhIGBQYXJhbWAuXG4gICAgIyBJbiBhIHNlbnNlLCBhIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXIgcmVwcmVzZW50cyBtdWx0aXBsZSBKUyBwYXJhbWV0ZXJzLiBUaGlzXG4gICAgIyBtZXRob2QgYWxsb3dzIHRvIGl0ZXJhdGUgdGhlbSBhbGwuXG4gICAgIyBUaGUgYGl0ZXJhdG9yYCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhcyBgaXRlcmF0b3IobmFtZSwgbm9kZSlgIHdoZXJlXG4gICAgIyBgbmFtZWAgaXMgdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlciBhbmQgYG5vZGVgIGlzIHRoZSBBU1Qgbm9kZSBjb3JyZXNwb25kaW5nIHRvIHRoYXQgbmFtZS5cbiAgICBcbiAgICBlYWNoTmFtZTogKGl0ZXJhdG9yLCBuYW1lID0gQG5hbWUpLT5cbiAgICAgICAgXG4gICAgICAgIGF0UGFyYW0gPSAob2JqKSAtPiBcbiAgICAgICAgICAgICMgbG9nICdBJywgXCJAI3tvYmoucHJvcGVydGllc1swXS5uYW1lLnZhbHVlfVwiXG4gICAgICAgICAgICBpdGVyYXRvciBcIkAje29iai5wcm9wZXJ0aWVzWzBdLm5hbWUudmFsdWV9XCIsIG9ialxuICAgICAgICBcbiAgICAgICAgaWYgbmFtZSBpbnN0YW5jZW9mIElkZW50aWZpZXJMaXRlcmFsXG4gICAgICAgICAgICByZXR1cm4gaWYgbmFtZSBpbnN0YW5jZW9mIE51bGxMaXRlcmFsXG4gICAgICAgICAgICAjIGxvZyAnQicsIG5hbWUudmFsdWUsIG5hbWVcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvciBuYW1lLnZhbHVlLCBuYW1lICMgc2ltcGxlIGxpdGVyYWxzIGBmb29gLCBgX2AsIGV0Yy5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhdFBhcmFtIG5hbWUgaWYgbmFtZSBpbnN0YW5jZW9mIFZhbHVlICMgYXQtcGFyYW1zIGBAZm9vYFxuICAgICAgICBcbiAgICAgICAgZm9yIG9iaiBpbiBuYW1lLm9iamVjdHMgPyBbXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ24gYW5kIG5vdCBvYmouY29udGV4dD8gIyBkZXN0cnVjdHVyZWQgcGFyYW1ldGVyIHdpdGggZGVmYXVsdCB2YWx1ZVxuICAgICAgICAgICAgICAgIG9iaiA9IG9iai52YXJpYWJsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBvYmogaW5zdGFuY2VvZiBBc3NpZ24gIyBhc3NpZ25tZW50cyB3aXRoaW4gZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMgYHtmb286YmFyfWBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBvYmoudmFsdWUgaW5zdGFuY2VvZiBBc3NpZ24gIyAuLi4gcG9zc2libHkgd2l0aCBhIGRlZmF1bHQgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgb2JqID0gb2JqLnZhbHVlXG4gICAgICAgICAgICAgICAgQGVhY2hOYW1lIGl0ZXJhdG9yLCBvYmoudmFsdWUudW53cmFwKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZSBpZiBvYmogaW5zdGFuY2VvZiBTcGxhdCAjIHNwbGF0cyB3aXRoaW4gZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMgYFt4cy4uLl1gXG4gICAgICAgICAgICAgICAgbm9kZSA9IG9iai5uYW1lLnVud3JhcCgpXG4gICAgICAgICAgICAgICAgIyBsb2cgJ0MnLCBub2RlLnZhbHVlXG4gICAgICAgICAgICAgICAgaXRlcmF0b3Igbm9kZS52YWx1ZSwgbm9kZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZSBpZiBvYmogaW5zdGFuY2VvZiBWYWx1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG9iai5pc0FycmF5KCkgb3Igb2JqLmlzT2JqZWN0KCkgIyBkZXN0cnVjdHVyZWQgcGFyYW1ldGVycyB3aXRoaW4gZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMgYFt7YX1dYFxuICAgICAgICAgICAgICAgICAgICBAZWFjaE5hbWUgaXRlcmF0b3IsIG9iai5iYXNlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBvYmoudGhpcyAjIGF0LXBhcmFtcyB3aXRoaW4gZGVzdHJ1Y3R1cmVkIHBhcmFtZXRlcnMgYHtAZm9vfWBcbiAgICAgICAgICAgICAgICAgICAgYXRQYXJhbSBvYmpcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICMgbG9nICdEJywgb2JqLmJhc2UudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3Igb2JqLmJhc2UudmFsdWUsIG9iai5iYXNlICMgc2ltcGxlIGRlc3RydWN0dXJlZCBwYXJhbWV0ZXJzIHtmb299XG4gICAgICAgICAgICBlbHNlIGlmIG9iaiBub3QgaW5zdGFuY2VvZiBFeHBhbnNpb25cbiAgICAgICAgICAgICAgICBvYmouZXJyb3IgXCJpbGxlZ2FsIHBhcmFtZXRlciAje29iai5jb21waWxlKCl9XCJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICBcbiMgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiMgQSBzcGxhdCwgZWl0aGVyIGFzIGEgcGFyYW1ldGVyIHRvIGEgZnVuY3Rpb24sIGFuIGFyZ3VtZW50IHRvIGEgY2FsbCwgb3IgYXMgcGFydCBvZiBhIGRlc3RydWN0dXJpbmcgYXNzaWdubWVudC5cblxuZXhwb3J0cy5TcGxhdCA9IGNsYXNzIFNwbGF0IGV4dGVuZHMgQmFzZVxuXG4gICAgY2hpbGRyZW46IFsnbmFtZSddXG5cbiAgICBpc0Fzc2lnbmFibGU6IFlFU1xuXG4gICAgY29uc3RydWN0b3I6IChuYW1lKSAtPlxuICAgICAgICBAbmFtZSA9IGlmIG5hbWUuY29tcGlsZSB0aGVuIG5hbWUgZWxzZSBuZXcgTGl0ZXJhbCBuYW1lXG5cbiAgICBhc3NpZ25zOiAobmFtZSkgLT5cbiAgICAgICAgQG5hbWUuYXNzaWducyBuYW1lXG5cbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIEBuYW1lLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICB1bndyYXA6IC0+IEBuYW1lXG5cbiAgICAjIFV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjb252ZXJ0cyBhbiBhcmJpdHJhcnkgbnVtYmVyIG9mIGVsZW1lbnRzLCBtaXhlZCB3aXRoIHNwbGF0cywgdG8gYSBwcm9wZXIgYXJyYXkuXG4gICAgXG4gICAgQGNvbXBpbGVTcGxhdHRlZEFycmF5OiAobywgbGlzdCwgYXBwbHkpIC0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgIGNvbnRpbnVlIHdoaWxlIChub2RlID0gbGlzdFsrK2luZGV4XSkgYW5kIG5vZGUgbm90IGluc3RhbmNlb2YgU3BsYXRcbiAgICAgICAgcmV0dXJuIFtdIGlmIGluZGV4ID49IGxpc3QubGVuZ3RoXG4gICAgICAgIGlmIGxpc3QubGVuZ3RoIGlzIDFcbiAgICAgICAgICAgIG5vZGUgPSBsaXN0WzBdXG4gICAgICAgICAgICBmcmFnbWVudHMgPSBub2RlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgICAgICByZXR1cm4gZnJhZ21lbnRzIGlmIGFwcGx5XG4gICAgICAgICAgICByZXR1cm4gW10uY29uY2F0IG5vZGUubWFrZUNvZGUoXCIjeyB1dGlsaXR5ICdzbGljZScsIG8gfS5jYWxsKFwiKSwgZnJhZ21lbnRzLCBub2RlLm1ha2VDb2RlKFwiKVwiKVxuICAgICAgICBhcmdzID0gbGlzdFtpbmRleC4uXVxuICAgICAgICBmb3Igbm9kZSwgaSBpbiBhcmdzXG4gICAgICAgICAgICBjb21waWxlZE5vZGUgPSBub2RlLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9MSVNUXG4gICAgICAgICAgICBhcmdzW2ldID0gaWYgbm9kZSBpbnN0YW5jZW9mIFNwbGF0XG4gICAgICAgICAgICB0aGVuIFtdLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiI3sgdXRpbGl0eSAnc2xpY2UnLCBvIH0uY2FsbChcIiksIGNvbXBpbGVkTm9kZSwgbm9kZS5tYWtlQ29kZShcIilcIilcbiAgICAgICAgICAgIGVsc2UgW10uY29uY2F0IG5vZGUubWFrZUNvZGUoXCJbXCIpLCBjb21waWxlZE5vZGUsIG5vZGUubWFrZUNvZGUoXCJdXCIpXG4gICAgICAgIGlmIGluZGV4IGlzIDBcbiAgICAgICAgICAgIG5vZGUgPSBsaXN0WzBdXG4gICAgICAgICAgICBjb25jYXRQYXJ0ID0gKG5vZGUuam9pbkZyYWdtZW50QXJyYXlzIGFyZ3NbMS4uXSwgJywgJylcbiAgICAgICAgICAgIHJldHVybiBhcmdzWzBdLmNvbmNhdCBub2RlLm1ha2VDb2RlKFwiLmNvbmNhdChcIiksIGNvbmNhdFBhcnQsIG5vZGUubWFrZUNvZGUoXCIpXCIpXG4gICAgICAgIGJhc2UgPSAobm9kZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfTElTVCBmb3Igbm9kZSBpbiBsaXN0Wy4uLmluZGV4XSlcbiAgICAgICAgYmFzZSA9IGxpc3RbMF0uam9pbkZyYWdtZW50QXJyYXlzIGJhc2UsICcsICdcbiAgICAgICAgY29uY2F0UGFydCA9IGxpc3RbaW5kZXhdLmpvaW5GcmFnbWVudEFycmF5cyBhcmdzLCAnLCAnXG4gICAgICAgIFsuLi4sIGxhc3RdID0gbGlzdFxuICAgICAgICBbXS5jb25jYXQgbGlzdFswXS5tYWtlQ29kZShcIltcIiksIGJhc2UsIGxpc3RbaW5kZXhdLm1ha2VDb2RlKFwiXS5jb25jYXQoXCIpLCBjb25jYXRQYXJ0LCBsYXN0Lm1ha2VDb2RlKFwiKVwiKVxuXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG4jIFVzZWQgdG8gc2tpcCB2YWx1ZXMgaW5zaWRlIGFuIGFycmF5IGRlc3RydWN0dXJpbmcgKHBhdHRlcm4gbWF0Y2hpbmcpIG9yIHBhcmFtZXRlciBsaXN0LlxuXG5leHBvcnRzLkV4cGFuc2lvbiA9IGNsYXNzIEV4cGFuc2lvbiBleHRlbmRzIEJhc2VcblxuICAgIGlzQ29tcGxleDogTk9cblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgQGVycm9yICdFeHBhbnNpb24gbXVzdCBiZSB1c2VkIGluc2lkZSBhIGRlc3RydWN0dXJpbmcgYXNzaWdubWVudCBvciBwYXJhbWV0ZXIgbGlzdCdcblxuICAgIGFzUmVmZXJlbmNlOiAobykgLT5cbiAgICAgICAgdGhpc1xuXG4gICAgZWFjaE5hbWU6IChpdGVyYXRvcikgLT5cblxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuIyBBIHdoaWxlIGxvb3AsIHRoZSBvbmx5IHNvcnQgb2YgbG93LWxldmVsIGxvb3AgZXhwb3NlZCBieSBLb2ZmZWUuIEZyb21cbiMgaXQsIGFsbCBvdGhlciBsb29wcyBjYW4gYmUgbWFudWZhY3R1cmVkLiBVc2VmdWwgaW4gY2FzZXMgd2hlcmUgeW91IG5lZWQgbW9yZVxuIyBmbGV4aWJpbGl0eSBvciBtb3JlIHNwZWVkIHRoYW4gYSBjb21wcmVoZW5zaW9uIGNhbiBwcm92aWRlLlxuXG5leHBvcnRzLldoaWxlID0gY2xhc3MgV2hpbGUgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChjb25kaXRpb24sIG9wdGlvbnMpIC0+XG4gICAgICAgIEBjb25kaXRpb24gPSBpZiBvcHRpb25zPy5pbnZlcnQgdGhlbiBjb25kaXRpb24uaW52ZXJ0KCkgZWxzZSBjb25kaXRpb25cbiAgICAgICAgQGd1YXJkICAgICAgID0gb3B0aW9ucz8uZ3VhcmRcblxuICAgIGNoaWxkcmVuOiBbJ2NvbmRpdGlvbicsICdndWFyZCcsICdib2R5J11cblxuICAgIGlzU3RhdGVtZW50OiBZRVNcblxuICAgIG1ha2VSZXR1cm46IChyZXMpIC0+XG4gICAgICAgIGlmIHJlc1xuICAgICAgICAgICAgc3VwZXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJldHVybnMgPSBub3QgQGp1bXBzIGxvb3A6IHllc1xuICAgICAgICAgICAgdGhpc1xuXG4gICAgYWRkQm9keTogKEBib2R5KSAtPlxuICAgICAgICB0aGlzXG5cbiAgICBqdW1wczogLT5cbiAgICAgICAge2V4cHJlc3Npb25zfSA9IEBib2R5XG4gICAgICAgIHJldHVybiBubyB1bmxlc3MgZXhwcmVzc2lvbnMubGVuZ3RoXG4gICAgICAgIGZvciBub2RlIGluIGV4cHJlc3Npb25zXG4gICAgICAgICAgICByZXR1cm4ganVtcE5vZGUgaWYganVtcE5vZGUgPSBub2RlLmp1bXBzIGxvb3A6IHllc1xuICAgICAgICBub1xuXG4gICAgIyBUaGUgbWFpbiBkaWZmZXJlbmNlIGZyb20gYSBKYXZhU2NyaXB0ICp3aGlsZSogaXMgdGhhdCB0aGUgS29mZmVlXG4gICAgIyAqd2hpbGUqIGNhbiBiZSB1c2VkIGFzIGEgcGFydCBvZiBhIGxhcmdlciBleHByZXNzaW9uIC0tIHdoaWxlIGxvb3BzIG1heVxuICAgICMgcmV0dXJuIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGNvbXB1dGVkIHJlc3VsdCBvZiBlYWNoIGl0ZXJhdGlvbi5cbiAgICBcbiAgICBjb21waWxlTm9kZTogKG8pIC0+XG4gICAgICAgIG8uaW5kZW50ICs9IFRBQlxuICAgICAgICBzZXQgICAgICAgICAgPSAnJ1xuICAgICAgICB7Ym9keX0gICA9IHRoaXNcbiAgICAgICAgaWYgYm9keS5pc0VtcHR5KClcbiAgICAgICAgICAgIGJvZHkgPSBAbWFrZUNvZGUgJydcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQHJldHVybnNcbiAgICAgICAgICAgICAgICBib2R5Lm1ha2VSZXR1cm4gcnZhciA9IG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZXN1bHRzJ1xuICAgICAgICAgICAgICAgIHNldCAgPSBcIiN7QHRhYn0je3J2YXJ9ID0gW107XFxuXCJcbiAgICAgICAgICAgIGlmIEBndWFyZFxuICAgICAgICAgICAgICAgIGlmIGJvZHkuZXhwcmVzc2lvbnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgbmV3IElmIChuZXcgUGFyZW5zIEBndWFyZCkuaW52ZXJ0KCksIG5ldyBTdGF0ZW1lbnRMaXRlcmFsIFwiY29udGludWVcIlxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYm9keSA9IEJsb2NrLndyYXAgW25ldyBJZiBAZ3VhcmQsIGJvZHldIGlmIEBndWFyZFxuICAgICAgICAgICAgYm9keSA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoXCJcXG5cIiksIChib2R5LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1ApLCBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9XCIpXG4gICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBAbWFrZUNvZGUoc2V0ICsgQHRhYiArIFwid2hpbGUgKFwiKSwgQGNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfUEFSRU4pLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiKSB7XCIpLCBib2R5LCBAbWFrZUNvZGUoXCJ9XCIpXG4gICAgICAgIGlmIEByZXR1cm5zXG4gICAgICAgICAgICBhbnN3ZXIucHVzaCBAbWFrZUNvZGUgXCJcXG4je0B0YWJ9cmV0dXJuICN7cnZhcn07XCJcbiAgICAgICAgYW5zd2VyXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG5cbiMgU2ltcGxlIEFyaXRobWV0aWMgYW5kIGxvZ2ljYWwgb3BlcmF0aW9ucy4gUGVyZm9ybXMgc29tZSBjb252ZXJzaW9uIGZyb20gaW50byB0aGVpciBKYXZhU2NyaXB0IGVxdWl2YWxlbnRzLlxuXG5leHBvcnRzLk9wID0gY2xhc3MgT3AgZXh0ZW5kcyBCYXNlXG4gICAgY29uc3RydWN0b3I6IChvcCwgZmlyc3QsIHNlY29uZCwgZmxpcCApIC0+XG4gICAgICAgIHJldHVybiBuZXcgSW4gZmlyc3QsIHNlY29uZCBpZiBvcCBpcyAnaW4nXG4gICAgICAgIGlmIG9wIGlzICdkbydcbiAgICAgICAgICAgIHJldHVybiBAZ2VuZXJhdGVEbyBmaXJzdFxuICAgICAgICBpZiBvcCBpcyAnbmV3J1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0Lm5ld0luc3RhbmNlKCkgaWYgZmlyc3QgaW5zdGFuY2VvZiBDYWxsIGFuZCBub3QgZmlyc3QuZG8gYW5kIG5vdCBmaXJzdC5pc05ld1xuICAgICAgICAgICAgZmlyc3QgPSBuZXcgUGFyZW5zIGZpcnN0ICAgICBpZiBmaXJzdCBpbnN0YW5jZW9mIENvZGUgYW5kIGZpcnN0LmJvdW5kIG9yIGZpcnN0LmRvXG4gICAgICAgIEBvcGVyYXRvciA9IENPTlZFUlNJT05TW29wXSBvciBvcFxuICAgICAgICBAZmlyc3QgICAgPSBmaXJzdFxuICAgICAgICBAc2Vjb25kICAgPSBzZWNvbmRcbiAgICAgICAgQGZsaXAgICAgID0gISFmbGlwXG4gICAgICAgIHJldHVybiB0aGlzXG5cbiAgICBDT05WRVJTSU9OUyA9ICMgVGhlIG1hcCBvZiBjb252ZXJzaW9ucyB0byBKYXZhU2NyaXB0IHN5bWJvbHMuXG4gICAgICAgICc9PSc6ICAgICAgICAnPT09J1xuICAgICAgICAnIT0nOiAgICAgICAgJyE9PSdcbiAgICAgICAgJ29mJzogICAgICAgICdpbidcbiAgICAgICAgJ3lpZWxkZnJvbSc6ICd5aWVsZConXG5cbiAgICBJTlZFUlNJT05TID0gIyBUaGUgbWFwIG9mIGludmVydGlibGUgb3BlcmF0b3JzLlxuICAgICAgICAnIT09JzogJz09PSdcbiAgICAgICAgJz09PSc6ICchPT0nXG5cbiAgICBjaGlsZHJlbjogWydmaXJzdCcsICdzZWNvbmQnXVxuXG4gICAgaXNOdW1iZXI6IC0+XG4gICAgICAgIEBpc1VuYXJ5KCkgYW5kIEBvcGVyYXRvciBpbiBbJysnLCAnLSddIGFuZFxuICAgICAgICAgICAgQGZpcnN0IGluc3RhbmNlb2YgVmFsdWUgYW5kIEBmaXJzdC5pc051bWJlcigpXG5cbiAgICBpc1lpZWxkOiAtPlxuICAgICAgICBAb3BlcmF0b3IgaW4gWyd5aWVsZCcsICd5aWVsZConXVxuXG4gICAgaXNVbmFyeTogLT5cbiAgICAgICAgbm90IEBzZWNvbmRcblxuICAgIGlzQ29tcGxleDogLT5cbiAgICAgICAgbm90IEBpc051bWJlcigpXG5cbiAgICAjIEFtIEkgY2FwYWJsZSBvZiBbUHl0aG9uLXN0eWxlIGNvbXBhcmlzb24gY2hhaW5pbmddKGh0dHBzOi8vZG9jcy5weXRob24ub3JnLzMvcmVmZXJlbmNlL2V4cHJlc3Npb25zLmh0bWwjbm90LWluKT9cbiAgICBcbiAgICBpc0NoYWluYWJsZTogLT5cbiAgICAgICAgQG9wZXJhdG9yIGluIFsnPCcsICc+JywgJz49JywgJzw9JywgJz09PScsICchPT0nXVxuXG4gICAgaW52ZXJ0OiAtPlxuICAgICAgICBpZiBAaXNDaGFpbmFibGUoKSBhbmQgQGZpcnN0LmlzQ2hhaW5hYmxlKClcbiAgICAgICAgICAgIGFsbEludmVydGFibGUgPSB5ZXNcbiAgICAgICAgICAgIGN1cnIgPSB0aGlzXG4gICAgICAgICAgICB3aGlsZSBjdXJyIGFuZCBjdXJyLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgYWxsSW52ZXJ0YWJsZSBhbmQ9IChjdXJyLm9wZXJhdG9yIG9mIElOVkVSU0lPTlMpXG4gICAgICAgICAgICAgICAgY3VyciA9IGN1cnIuZmlyc3RcbiAgICAgICAgICAgIHJldHVybiBuZXcgUGFyZW5zKHRoaXMpLmludmVydCgpIHVubGVzcyBhbGxJbnZlcnRhYmxlXG4gICAgICAgICAgICBjdXJyID0gdGhpc1xuICAgICAgICAgICAgd2hpbGUgY3VyciBhbmQgY3Vyci5vcGVyYXRvclxuICAgICAgICAgICAgICAgIGN1cnIuaW52ZXJ0ID0gIWN1cnIuaW52ZXJ0XG4gICAgICAgICAgICAgICAgY3Vyci5vcGVyYXRvciA9IElOVkVSU0lPTlNbY3Vyci5vcGVyYXRvcl1cbiAgICAgICAgICAgICAgICBjdXJyID0gY3Vyci5maXJzdFxuICAgICAgICAgICAgdGhpc1xuICAgICAgICBlbHNlIGlmIG9wID0gSU5WRVJTSU9OU1tAb3BlcmF0b3JdXG4gICAgICAgICAgICBAb3BlcmF0b3IgPSBvcFxuICAgICAgICAgICAgaWYgQGZpcnN0LnVud3JhcCgpIGluc3RhbmNlb2YgT3BcbiAgICAgICAgICAgICAgICBAZmlyc3QuaW52ZXJ0KClcbiAgICAgICAgICAgIHRoaXNcbiAgICAgICAgZWxzZSBpZiBAc2Vjb25kXG4gICAgICAgICAgICBuZXcgUGFyZW5zKHRoaXMpLmludmVydCgpXG4gICAgICAgIGVsc2UgaWYgQG9wZXJhdG9yIGlzICchJyBhbmQgKGZzdCA9IEBmaXJzdC51bndyYXAoKSkgaW5zdGFuY2VvZiBPcCBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnN0Lm9wZXJhdG9yIGluIFsnIScsICdpbicsICdpbnN0YW5jZW9mJ11cbiAgICAgICAgICAgIGZzdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBuZXcgT3AgJyEnLCB0aGlzXG5cbiAgICB1bmZvbGRTb2FrOiAobykgLT5cbiAgICAgICAgQG9wZXJhdG9yIGluIFsnKysnLCAnLS0nLCAnZGVsZXRlJ10gYW5kIHVuZm9sZFNvYWsgbywgdGhpcywgJ2ZpcnN0J1xuXG4gICAgZ2VuZXJhdGVEbzogKGV4cCkgLT5cbiAgICAgICAgcGFzc2VkUGFyYW1zID0gW11cbiAgICAgICAgZnVuYyA9IGlmIGV4cCBpbnN0YW5jZW9mIEFzc2lnbiBhbmQgKHJlZiA9IGV4cC52YWx1ZS51bndyYXAoKSkgaW5zdGFuY2VvZiBDb2RlXG4gICAgICAgICAgICByZWZcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXhwXG4gICAgICAgIGZvciBwYXJhbSBpbiBmdW5jLnBhcmFtcyBvciBbXVxuICAgICAgICAgICAgaWYgcGFyYW0udmFsdWVcbiAgICAgICAgICAgICAgICBwYXNzZWRQYXJhbXMucHVzaCBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwYXJhbS52YWx1ZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBhc3NlZFBhcmFtcy5wdXNoIHBhcmFtXG4gICAgICAgIGNhbGwgPSBuZXcgQ2FsbCBleHAsIHBhc3NlZFBhcmFtc1xuICAgICAgICBjYWxsLmRvID0geWVzXG4gICAgICAgIGNhbGxcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgaXNDaGFpbiA9IEBpc0NoYWluYWJsZSgpIGFuZCBAZmlyc3QuaXNDaGFpbmFibGUoKVxuICAgICAgICAjIEluIGNoYWlucywgdGhlcmUncyBubyBuZWVkIHRvIHdyYXAgYmFyZSBvYmogbGl0ZXJhbHMgaW4gcGFyZW5zLFxuICAgICAgICAjIGFzIHRoZSBjaGFpbmVkIGV4cHJlc3Npb24gaXMgd3JhcHBlZC5cbiAgICAgICAgQGZpcnN0LmZyb250ID0gQGZyb250IHVubGVzcyBpc0NoYWluXG4gICAgICAgIGlmIEBvcGVyYXRvciBpcyAnZGVsZXRlJyBhbmQgby5zY29wZS5jaGVjayhAZmlyc3QudW53cmFwQWxsKCkudmFsdWUpXG4gICAgICAgICAgICBAZXJyb3IgJ2RlbGV0ZSBvcGVyYW5kIG1heSBub3QgYmUgYXJndW1lbnQgb3IgdmFyJ1xuICAgICAgICBpZiBAb3BlcmF0b3IgaW4gWyctLScsICcrKyddXG4gICAgICAgICAgICBtZXNzYWdlID0gaXNVbmFzc2lnbmFibGUgQGZpcnN0LnVud3JhcEFsbCgpLnZhbHVlXG4gICAgICAgICAgICBAZmlyc3QuZXJyb3IgbWVzc2FnZSBpZiBtZXNzYWdlXG4gICAgICAgIHJldHVybiBAY29tcGlsZVlpZWxkIG8gaWYgQGlzWWllbGQoKVxuICAgICAgICByZXR1cm4gQGNvbXBpbGVVbmFyeSBvIGlmIEBpc1VuYXJ5KClcbiAgICAgICAgcmV0dXJuIEBjb21waWxlQ2hhaW4gbyBpZiBpc0NoYWluXG4gICAgICAgIHN3aXRjaCBAb3BlcmF0b3JcbiAgICAgICAgICAgIHdoZW4gJz8nICAgIHRoZW4gQGNvbXBpbGVFeGlzdGVuY2Ugb1xuICAgICAgICAgICAgd2hlbiAnKionIHRoZW4gQGNvbXBpbGVQb3dlciBvXG4gICAgICAgICAgICB3aGVuICcvLycgdGhlbiBAY29tcGlsZUZsb29yRGl2aXNpb24gb1xuICAgICAgICAgICAgd2hlbiAnJSUnIHRoZW4gQGNvbXBpbGVNb2R1bG8gb1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGxocyA9IEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgICAgICAgICByaHMgPSBAc2Vjb25kLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUFxuICAgICAgICAgICAgICAgIGFuc3dlciA9IFtdLmNvbmNhdCBsaHMsIEBtYWtlQ29kZShcIiAje0BvcGVyYXRvcn0gXCIpLCByaHNcbiAgICAgICAgICAgICAgICBpZiBvLmxldmVsIDw9IExFVkVMX09QIHRoZW4gYW5zd2VyIGVsc2UgQHdyYXBJbkJyYWNlcyBhbnN3ZXJcblxuICAgICMgTWltaWMgUHl0aG9uJ3MgY2hhaW5lZCBjb21wYXJpc29ucyB3aGVuIG11bHRpcGxlIGNvbXBhcmlzb24gb3BlcmF0b3JzIGFyZVxuICAgICMgdXNlZCBzZXF1ZW50aWFsbHkuIEZvciBleGFtcGxlOlxuICAgICNcbiAgICAjICAgICAgICAgICBiaW4va29mZmVlIC1lICdjb25zb2xlLmxvZyA1MCA8IDY1ID4gMTAnXG4gICAgIyAgICAgICAgICAgdHJ1ZVxuICAgIFxuICAgIGNvbXBpbGVDaGFpbjogKG8pIC0+XG4gICAgICAgIFtAZmlyc3Quc2Vjb25kLCBzaGFyZWRdID0gQGZpcnN0LnNlY29uZC5jYWNoZSBvXG4gICAgICAgIGZzdCA9IEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgZnJhZ21lbnRzID0gZnN0LmNvbmNhdCBAbWFrZUNvZGUoXCIgI3tpZiBAaW52ZXJ0IHRoZW4gJyYmJyBlbHNlICd8fCd9IFwiKSxcbiAgICAgICAgICAgIChzaGFyZWQuY29tcGlsZVRvRnJhZ21lbnRzIG8pLCBAbWFrZUNvZGUoXCIgI3tAb3BlcmF0b3J9IFwiKSwgKEBzZWNvbmQuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QKVxuICAgICAgICBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgIyBLZWVwIHJlZmVyZW5jZSB0byB0aGUgbGVmdCBleHByZXNzaW9uLCB1bmxlc3MgdGhpcyBhbiBleGlzdGVudGlhbCBhc3NpZ25tZW50XG4gICAgY29tcGlsZUV4aXN0ZW5jZTogKG8pIC0+XG4gICAgICAgIGlmIEBmaXJzdC5pc0NvbXBsZXgoKVxuICAgICAgICAgICAgcmVmID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIG8uc2NvcGUuZnJlZVZhcmlhYmxlICdyZWYnXG4gICAgICAgICAgICBmc3QgPSBuZXcgUGFyZW5zIG5ldyBBc3NpZ24gcmVmLCBAZmlyc3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZnN0ID0gQGZpcnN0XG4gICAgICAgICAgICByZWYgPSBmc3RcbiAgICAgICAgbmV3IElmKG5ldyBFeGlzdGVuY2UoZnN0KSwgcmVmLCB0eXBlOiAnaWYnKS5hZGRFbHNlKEBzZWNvbmQpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICAjIENvbXBpbGUgYSB1bmFyeSAqKk9wKiouXG4gICAgY29tcGlsZVVuYXJ5OiAobykgLT5cbiAgICAgICAgcGFydHMgPSBbXVxuICAgICAgICBvcCA9IEBvcGVyYXRvclxuICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgb3BdXG4gICAgICAgIGlmIG9wIGlzICchJyBhbmQgQGZpcnN0IGluc3RhbmNlb2YgRXhpc3RlbmNlXG4gICAgICAgICAgICBAZmlyc3QubmVnYXRlZCA9IG5vdCBAZmlyc3QubmVnYXRlZFxuICAgICAgICAgICAgcmV0dXJuIEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgb1xuICAgICAgICBpZiBvLmxldmVsID49IExFVkVMX0FDQ0VTU1xuICAgICAgICAgICAgcmV0dXJuIChuZXcgUGFyZW5zIHRoaXMpLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIHBsdXNNaW51cyA9IG9wIGluIFsnKycsICctJ11cbiAgICAgICAgcGFydHMucHVzaCBbQG1ha2VDb2RlKCcgJyldIGlmIG9wIGluIFsnbmV3JywgJ3R5cGVvZicsICdkZWxldGUnXSBvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVzTWludXMgYW5kIEBmaXJzdCBpbnN0YW5jZW9mIE9wIGFuZCBAZmlyc3Qub3BlcmF0b3IgaXMgb3BcbiAgICAgICAgaWYgKHBsdXNNaW51cyBhbmQgQGZpcnN0IGluc3RhbmNlb2YgT3ApIG9yIChvcCBpcyAnbmV3JyBhbmQgQGZpcnN0LmlzU3RhdGVtZW50IG8pXG4gICAgICAgICAgICBAZmlyc3QgPSBuZXcgUGFyZW5zIEBmaXJzdFxuICAgICAgICBwYXJ0cy5wdXNoIEBmaXJzdC5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfT1BcbiAgICAgICAgcGFydHMucmV2ZXJzZSgpIGlmIEBmbGlwXG4gICAgICAgIEBqb2luRnJhZ21lbnRBcnJheXMgcGFydHMsICcnXG5cbiAgICBjb21waWxlWWllbGQ6IChvKSAtPlxuICAgICAgICBwYXJ0cyA9IFtdXG4gICAgICAgIG9wID0gQG9wZXJhdG9yXG4gICAgICAgIHVubGVzcyBvLnNjb3BlLnBhcmVudD9cbiAgICAgICAgICAgIEBlcnJvciAneWllbGQgY2FuIG9ubHkgb2NjdXIgaW5zaWRlIGZ1bmN0aW9ucydcbiAgICAgICAgaWYgJ2V4cHJlc3Npb24nIGluIE9iamVjdC5rZXlzKEBmaXJzdCkgYW5kIG5vdCAoQGZpcnN0IGluc3RhbmNlb2YgVGhyb3cpXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIEBmaXJzdC5leHByZXNzaW9uLmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9PUCBpZiBAZmlyc3QuZXhwcmVzc2lvbj9cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGFydHMucHVzaCBbQG1ha2VDb2RlIFwiKFwiXSBpZiBvLmxldmVsID49IExFVkVMX1BBUkVOXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgb3BdXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgXCIgXCJdIGlmIEBmaXJzdC5iYXNlPy52YWx1ZSAhPSAnJ1xuICAgICAgICAgICAgcGFydHMucHVzaCBAZmlyc3QuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX09QXG4gICAgICAgICAgICBwYXJ0cy5wdXNoIFtAbWFrZUNvZGUgXCIpXCJdIGlmIG8ubGV2ZWwgPj0gTEVWRUxfUEFSRU5cbiAgICAgICAgQGpvaW5GcmFnbWVudEFycmF5cyBwYXJ0cywgJydcblxuICAgIGNvbXBpbGVQb3dlcjogKG8pIC0+XG4gICAgICAgICMgTWFrZSBhIE1hdGgucG93IGNhbGxcbiAgICAgICAgcG93ID0gbmV3IFZhbHVlIG5ldyBJZGVudGlmaWVyTGl0ZXJhbCgnTWF0aCcpLCBbbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdwb3cnXVxuICAgICAgICBuZXcgQ2FsbChwb3csIFtAZmlyc3QsIEBzZWNvbmRdKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgY29tcGlsZUZsb29yRGl2aXNpb246IChvKSAtPlxuICAgICAgICBmbG9vciA9IG5ldyBWYWx1ZSBuZXcgSWRlbnRpZmllckxpdGVyYWwoJ01hdGgnKSwgW25ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAnZmxvb3InXVxuICAgICAgICBzZWNvbmQgPSBpZiBAc2Vjb25kLmlzQ29tcGxleCgpIHRoZW4gbmV3IFBhcmVucyBAc2Vjb25kIGVsc2UgQHNlY29uZFxuICAgICAgICBkaXYgPSBuZXcgT3AgJy8nLCBAZmlyc3QsIHNlY29uZFxuICAgICAgICBuZXcgQ2FsbChmbG9vciwgW2Rpdl0pLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG5cbiAgICBjb21waWxlTW9kdWxvOiAobykgLT5cbiAgICAgICAgbW9kID0gbmV3IFZhbHVlIG5ldyBMaXRlcmFsIHV0aWxpdHkgJ21vZHVsbycsIG9cbiAgICAgICAgbmV3IENhbGwobW9kLCBbQGZpcnN0LCBAc2Vjb25kXSkuY29tcGlsZVRvRnJhZ21lbnRzIG9cblxuICAgIHRvU3RyaW5nOiAoaWR0KSAtPlxuICAgICAgICBzdXBlciBpZHQsIEBjb25zdHJ1Y3Rvci5uYW1lICsgJyAnICsgQG9wZXJhdG9yXG5cbiMgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgXG4jIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwICAwMDAgIDAwMDAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgXG5cbmV4cG9ydHMuSW4gPSBjbGFzcyBJbiBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBvYmplY3QsIEBhcnJheSkgLT5cblxuICAgIGNoaWxkcmVuOiBbJ29iamVjdCcsICdhcnJheSddXG5cbiAgICBpbnZlcnQ6IE5FR0FURVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBpZiBAYXJyYXkgaW5zdGFuY2VvZiBWYWx1ZSBhbmQgQGFycmF5LmlzQXJyYXkoKSBhbmQgQGFycmF5LmJhc2Uub2JqZWN0cy5sZW5ndGhcbiAgICAgICAgICAgIGZvciBvYmogaW4gQGFycmF5LmJhc2Uub2JqZWN0cyB3aGVuIG9iaiBpbnN0YW5jZW9mIFNwbGF0XG4gICAgICAgICAgICAgICAgaGFzU3BsYXQgPSB5ZXNcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgIyBgY29tcGlsZU9yVGVzdGAgb25seSBpZiB3ZSBoYXZlIGFuIGFycmF5IGxpdGVyYWwgd2l0aCBubyBzcGxhdHNcbiAgICAgICAgICAgIHJldHVybiBAY29tcGlsZU9yVGVzdCBvIHVubGVzcyBoYXNTcGxhdFxuICAgICAgICBAY29tcGlsZUxvb3BUZXN0IG9cblxuICAgIGNvbXBpbGVPclRlc3Q6IChvKSAtPlxuICAgICAgICBbc3ViLCByZWZdID0gQG9iamVjdC5jYWNoZSBvLCBMRVZFTF9PUFxuICAgICAgICBbY21wLCBjbmpdID0gaWYgQG5lZ2F0ZWQgdGhlbiBbJyAhPT0gJywgJyAmJiAnXSBlbHNlIFsnID09PSAnLCAnIHx8ICddXG4gICAgICAgIHRlc3RzID0gW11cbiAgICAgICAgZm9yIGl0ZW0sIGkgaW4gQGFycmF5LmJhc2Uub2JqZWN0c1xuICAgICAgICAgICAgaWYgaSB0aGVuIHRlc3RzLnB1c2ggQG1ha2VDb2RlIGNualxuICAgICAgICAgICAgdGVzdHMgPSB0ZXN0cy5jb25jYXQgKGlmIGkgdGhlbiByZWYgZWxzZSBzdWIpLCBAbWFrZUNvZGUoY21wKSwgaXRlbS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfQUNDRVNTKVxuICAgICAgICBpZiBvLmxldmVsIDwgTEVWRUxfT1AgdGhlbiB0ZXN0cyBlbHNlIEB3cmFwSW5CcmFjZXMgdGVzdHNcblxuICAgIGNvbXBpbGVMb29wVGVzdDogKG8pIC0+XG4gICAgICAgIFtzdWIsIHJlZl0gPSBAb2JqZWN0LmNhY2hlIG8sIExFVkVMX0xJU1RcbiAgICAgICAgZnJhZ21lbnRzID0gW10uY29uY2F0IEBtYWtlQ29kZSh1dGlsaXR5KCdpbmRleE9mJywgbykgKyBcIi5jYWxsKFwiKSwgQGFycmF5LmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9MSVNUKSxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIiwgXCIpLCByZWYsIEBtYWtlQ29kZShcIikgXCIgKyBpZiBAbmVnYXRlZCB0aGVuICc8IDAnIGVsc2UgJz49IDAnKVxuICAgICAgICByZXR1cm4gZnJhZ21lbnRzIGlmIGZyYWdtZW50c1RvVGV4dChzdWIpIGlzIGZyYWdtZW50c1RvVGV4dChyZWYpXG4gICAgICAgIGZyYWdtZW50cyA9IHN1Yi5jb25jYXQgQG1ha2VDb2RlKCcsICcpLCBmcmFnbWVudHNcbiAgICAgICAgaWYgby5sZXZlbCA8IExFVkVMX0xJU1QgdGhlbiBmcmFnbWVudHMgZWxzZSBAd3JhcEluQnJhY2VzIGZyYWdtZW50c1xuXG4gICAgdG9TdHJpbmc6IChpZHQpIC0+XG4gICAgICAgIHN1cGVyIGlkdCwgQGNvbnN0cnVjdG9yLm5hbWUgKyBpZiBAbmVnYXRlZCB0aGVuICchJyBlbHNlICcnXG5cbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuIyAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAwMCAgICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4jIEEgY2xhc3NpYyAqdHJ5L2NhdGNoL2ZpbmFsbHkqIGJsb2NrLlxuXG5leHBvcnRzLlRyeSA9IGNsYXNzIFRyeSBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBhdHRlbXB0LCBAZXJyb3JWYXJpYWJsZSwgQHJlY292ZXJ5LCBAZW5zdXJlKSAtPlxuXG4gICAgY2hpbGRyZW46IFsnYXR0ZW1wdCcsICdyZWNvdmVyeScsICdlbnN1cmUnXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuXG4gICAganVtcHM6IChvKSAtPiBAYXR0ZW1wdC5qdW1wcyhvKSBvciBAcmVjb3Zlcnk/Lmp1bXBzKG8pXG5cbiAgICBtYWtlUmV0dXJuOiAocmVzKSAtPlxuICAgICAgICBAYXR0ZW1wdCAgPSBAYXR0ZW1wdCAubWFrZVJldHVybiByZXMgaWYgQGF0dGVtcHRcbiAgICAgICAgQHJlY292ZXJ5ID0gQHJlY292ZXJ5Lm1ha2VSZXR1cm4gcmVzIGlmIEByZWNvdmVyeVxuICAgICAgICB0aGlzXG5cbiAgICAjIENvbXBpbGF0aW9uIGlzIG1vcmUgb3IgbGVzcyBhcyB5b3Ugd291bGQgZXhwZWN0IC0tIHRoZSAqZmluYWxseSogY2xhdXNlXG4gICAgIyBpcyBvcHRpb25hbCwgdGhlICpjYXRjaCogaXMgbm90LlxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgby5pbmRlbnQgKz0gVEFCXG4gICAgICAgIHRyeVBhcnQgICA9IEBhdHRlbXB0LmNvbXBpbGVUb0ZyYWdtZW50cyBvLCBMRVZFTF9UT1BcblxuICAgICAgICBjYXRjaFBhcnQgPSBpZiBAcmVjb3ZlcnlcbiAgICAgICAgICAgIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2Vycm9yJywgcmVzZXJ2ZTogbm9cbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gbmV3IElkZW50aWZpZXJMaXRlcmFsIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lXG4gICAgICAgICAgICBpZiBAZXJyb3JWYXJpYWJsZVxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBpc1VuYXNzaWduYWJsZSBAZXJyb3JWYXJpYWJsZS51bndyYXBBbGwoKS52YWx1ZVxuICAgICAgICAgICAgICAgIEBlcnJvclZhcmlhYmxlLmVycm9yIG1lc3NhZ2UgaWYgbWVzc2FnZVxuICAgICAgICAgICAgICAgIEByZWNvdmVyeS51bnNoaWZ0IG5ldyBBc3NpZ24gQGVycm9yVmFyaWFibGUsIHBsYWNlaG9sZGVyXG4gICAgICAgICAgICBbXS5jb25jYXQgQG1ha2VDb2RlKFwiIGNhdGNoIChcIiksIHBsYWNlaG9sZGVyLmNvbXBpbGVUb0ZyYWdtZW50cyhvKSwgQG1ha2VDb2RlKFwiKSB7XFxuXCIpLFxuICAgICAgICAgICAgICAgIEByZWNvdmVyeS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKSwgQG1ha2VDb2RlKFwiXFxuI3tAdGFifX1cIilcbiAgICAgICAgZWxzZSB1bmxlc3MgQGVuc3VyZSBvciBAcmVjb3ZlcnlcbiAgICAgICAgICAgIGdlbmVyYXRlZEVycm9yVmFyaWFibGVOYW1lID0gby5zY29wZS5mcmVlVmFyaWFibGUgJ2Vycm9yJywgcmVzZXJ2ZTogbm9cbiAgICAgICAgICAgIFtAbWFrZUNvZGUoXCIgY2F0Y2ggKCN7Z2VuZXJhdGVkRXJyb3JWYXJpYWJsZU5hbWV9KSB7fVwiKV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgW11cblxuICAgICAgICBlbnN1cmVQYXJ0ID0gaWYgQGVuc3VyZSB0aGVuIChbXS5jb25jYXQgQG1ha2VDb2RlKFwiIGZpbmFsbHkge1xcblwiKSwgQGVuc3VyZS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfVE9QKSxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIlxcbiN7QHRhYn19XCIpKSBlbHNlIFtdXG5cbiAgICAgICAgW10uY29uY2F0IEBtYWtlQ29kZShcIiN7QHRhYn10cnkge1xcblwiKSxcbiAgICAgICAgICAgIHRyeVBhcnQsXG4gICAgICAgICAgICBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9fVwiKSwgY2F0Y2hQYXJ0LCBlbnN1cmVQYXJ0XG5cbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG5cbiMgU2ltcGxlIG5vZGUgdG8gdGhyb3cgYW4gZXhjZXB0aW9uLlxuXG5leHBvcnRzLlRocm93ID0gY2xhc3MgVGhyb3cgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAZXhwcmVzc2lvbikgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2V4cHJlc3Npb24nXVxuXG4gICAgaXNTdGF0ZW1lbnQ6IFlFU1xuICAgIGp1bXBzOiAgICAgICBOT1xuXG4gICAgIyBBICoqVGhyb3cqKiBpcyBhbHJlYWR5IGEgcmV0dXJuLCBvZiBzb3J0cy4uLlxuICAgIG1ha2VSZXR1cm46IFRISVNcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgW10uY29uY2F0IEBtYWtlQ29kZShAdGFiICsgXCJ0aHJvdyBcIiksIEBleHByZXNzaW9uLmNvbXBpbGVUb0ZyYWdtZW50cyhvKSwgQG1ha2VDb2RlKFwiO1wiKVxuXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4jIENoZWNrcyBhIHZhcmlhYmxlIGZvciBleGlzdGVuY2UgLS0gbm90ICpudWxsKiBhbmQgbm90ICp1bmRlZmluZWQqLiBUaGlzIGlzXG4jIHNpbWlsYXIgdG8gYC5uaWw/YCBpbiBSdWJ5LCBhbmQgYXZvaWRzIGhhdmluZyB0byBjb25zdWx0IGEgSmF2YVNjcmlwdCB0cnV0aFxuIyB0YWJsZS5cblxuZXhwb3J0cy5FeGlzdGVuY2UgPSBjbGFzcyBFeGlzdGVuY2UgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChAZXhwcmVzc2lvbikgLT5cblxuICAgIGNoaWxkcmVuOiBbJ2V4cHJlc3Npb24nXVxuXG4gICAgaW52ZXJ0OiBORUdBVEVcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgQGV4cHJlc3Npb24uZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgY29kZSA9IEBleHByZXNzaW9uLmNvbXBpbGUgbywgTEVWRUxfT1BcbiAgICAgICAgaWYgQGV4cHJlc3Npb24udW53cmFwKCkgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCBhbmQgbm90IG8uc2NvcGUuY2hlY2sgY29kZVxuICAgICAgICAgICAgW2NtcCwgY25qXSA9IGlmIEBuZWdhdGVkIHRoZW4gWyc9PT0nLCAnfHwnXSBlbHNlIFsnIT09JywgJyYmJ11cbiAgICAgICAgICAgIGNvZGUgPSBcInR5cGVvZiAje2NvZGV9ICN7Y21wfSBcXFwidW5kZWZpbmVkXFxcIiAje2Nuan0gI3tjb2RlfSAje2NtcH0gbnVsbFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgZG8gbm90IHVzZSBzdHJpY3QgZXF1YWxpdHkgaGVyZTsgaXQgd2lsbCBicmVhayBleGlzdGluZyBjb2RlXG4gICAgICAgICAgICBjb2RlID0gXCIje2NvZGV9ICN7aWYgQG5lZ2F0ZWQgdGhlbiAnPT0nIGVsc2UgJyE9J30gbnVsbFwiXG4gICAgICAgIFtAbWFrZUNvZGUoaWYgby5sZXZlbCA8PSBMRVZFTF9DT05EIHRoZW4gY29kZSBlbHNlIFwiKCN7Y29kZX0pXCIpXVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4jIEFuIGV4dHJhIHNldCBvZiBwYXJlbnRoZXNlcywgc3BlY2lmaWVkIGV4cGxpY2l0bHkgaW4gdGhlIHNvdXJjZS4gQXQgb25lIHRpbWVcbiMgd2UgdHJpZWQgdG8gY2xlYW4gdXAgdGhlIHJlc3VsdHMgYnkgZGV0ZWN0aW5nIGFuZCByZW1vdmluZyByZWR1bmRhbnRcbiMgcGFyZW50aGVzZXMsIGJ1dCBubyBsb25nZXIgLS0geW91IGNhbiBwdXQgaW4gYXMgbWFueSBhcyB5b3UgcGxlYXNlLlxuI1xuIyBQYXJlbnRoZXNlcyBhcmUgYSBnb29kIHdheSB0byBmb3JjZSBhbnkgc3RhdGVtZW50IHRvIGJlY29tZSBhbiBleHByZXNzaW9uLlxuXG5leHBvcnRzLlBhcmVucyA9IGNsYXNzIFBhcmVucyBleHRlbmRzIEJhc2VcbiAgICBcbiAgICBjb25zdHJ1Y3RvcjogKEBib2R5KSAtPlxuXG4gICAgY2hpbGRyZW46IFsnYm9keSddXG5cbiAgICB1bndyYXA6ICAgIC0+IEBib2R5XG4gICAgaXNDb21wbGV4OiAtPiBAYm9keS5pc0NvbXBsZXgoKVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBleHByID0gQGJvZHkudW53cmFwKClcbiAgICAgICAgaWYgZXhwciBpbnN0YW5jZW9mIFZhbHVlIGFuZCBleHByLmlzQXRvbWljKClcbiAgICAgICAgICAgIGV4cHIuZnJvbnQgPSBAZnJvbnRcbiAgICAgICAgICAgIHJldHVybiBleHByLmNvbXBpbGVUb0ZyYWdtZW50cyBvXG4gICAgICAgIGZyYWdtZW50cyA9IGV4cHIuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1BBUkVOXG4gICAgICAgIGJhcmUgPSBvLmxldmVsIDwgTEVWRUxfT1AgYW5kIChleHByIGluc3RhbmNlb2YgT3Agb3IgZXhwciBpbnN0YW5jZW9mIENhbGwgb3JcbiAgICAgICAgICAgIChleHByIGluc3RhbmNlb2YgRm9yIGFuZCBleHByLnJldHVybnMpKSBhbmQgKG8ubGV2ZWwgPCBMRVZFTF9DT05EIG9yXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLmxlbmd0aCA8PSAzKVxuICAgICAgICBpZiBiYXJlIHRoZW4gZnJhZ21lbnRzIGVsc2UgQHdyYXBJbkJyYWNlcyBmcmFnbWVudHNcblxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiMgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiMgU3RyaW5ncyB3aXRoIGludGVycG9sYXRpb25zIGFyZSBpbiBmYWN0IGp1c3QgYSB2YXJpYXRpb24gb2YgYFBhcmVuc2Agd2l0aCBzdHJpbmcgY29uY2F0ZW5hdGlvbiBpbnNpZGUuXG5cbmV4cG9ydHMuU3RyaW5nV2l0aEludGVycG9sYXRpb25zID0gY2xhc3MgU3RyaW5nV2l0aEludGVycG9sYXRpb25zIGV4dGVuZHMgUGFyZW5zXG4gICAgXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBcbiAgICAgICAgIyBUaGlzIG1ldGhvZCBwcm9kdWNlcyBhbiBpbnRlcnBvbGF0ZWQgc3RyaW5nIHVzaW5nIHRoZSBuZXcgRVMyMDE1IHN5bnRheCxcbiAgICAgICAgIyB3aGljaCBpcyBvcHQtaW4gYnkgdXNpbmcgdGFnZ2VkIHRlbXBsYXRlIGxpdGVyYWxzLiBcbiAgICAgICAgIyBJZiB0aGlzIFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9ucyBpc27igJl0IGluc2lkZSBhIHRhZ2dlZCB0ZW1wbGF0ZSBsaXRlcmFsLCBmYWxsIGJhY2sgdG8gdGhlIEtvZmZlZSAxLnggb3V0cHV0LlxuICAgICAgICBcbiAgICAgICAgdW5sZXNzIG8uaW5UYWdnZWRUZW1wbGF0ZUNhbGxcbiAgICAgICAgICAgIHJldHVybiBzdXBlclxuXG4gICAgICAgIGV4cHIgPSBAYm9keS51bndyYXAoKSAjIEFzc3VtcHRpb246IGV4cHIgaXMgVmFsdWU+U3RyaW5nTGl0ZXJhbCBvciBPcFxuXG4gICAgICAgIGVsZW1lbnRzID0gW11cbiAgICAgICAgZXhwci50cmF2ZXJzZUNoaWxkcmVuIG5vLCAobm9kZSkgLT5cbiAgICAgICAgICAgIGlmIG5vZGUgaW5zdGFuY2VvZiBTdHJpbmdMaXRlcmFsXG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaCBub2RlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHllc1xuICAgICAgICAgICAgZWxzZSBpZiBub2RlIGluc3RhbmNlb2YgUGFyZW5zXG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaCBub2RlXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vXG4gICAgICAgICAgICByZXR1cm4geWVzXG5cbiAgICAgICAgZnJhZ21lbnRzID0gW11cbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdgJ1xuICAgICAgICBmb3IgZWxlbWVudCBpbiBlbGVtZW50c1xuICAgICAgICAgICAgaWYgZWxlbWVudCBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGVsZW1lbnQudmFsdWVbMS4uLi0xXVxuICAgICAgICAgICAgICAgICMgQmFja3RpY2tzIGFuZCBgJHtgIGluc2lkZSB0ZW1wbGF0ZSBsaXRlcmFscyBtdXN0IGJlIGVzY2FwZWQuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlIC8oXFxcXCopKGB8XFwkXFx7KS9nLCAobWF0Y2gsIGJhY2tzbGFzaGVzLCB0b0JlRXNjYXBlZCkgLT5cbiAgICAgICAgICAgICAgICAgICAgaWYgYmFja3NsYXNoZXMubGVuZ3RoICUgMiBpcyAwXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiN7YmFja3NsYXNoZXN9XFxcXCN7dG9CZUVzY2FwZWR9XCJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgdmFsdWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmcmFnbWVudHMucHVzaCBAbWFrZUNvZGUgJyR7J1xuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIGVsZW1lbnQuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKS4uLlxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSAnfSdcbiAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlICdgJ1xuXG4gICAgICAgIGZyYWdtZW50c1xuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG5cbiMgUmVwbGFjZW1lbnQgZm9yIHRoZSAqZm9yKiBsb29wIGlzIG91ciBhcnJheSBhbmQgb2JqZWN0XG4jIGNvbXByZWhlbnNpb25zLCB0aGF0IGNvbXBpbGUgaW50byAqZm9yKiBsb29wcyBoZXJlLiBUaGV5IGFsc28gYWN0IGFzIGFuXG4jIGV4cHJlc3Npb24sIGFibGUgdG8gcmV0dXJuIHRoZSByZXN1bHQgb2YgZWFjaCBmaWx0ZXJlZCBpdGVyYXRpb24uXG4jXG4jIFVubGlrZSBQeXRob24gYXJyYXkgY29tcHJlaGVuc2lvbnMsIHRoZXkgY2FuIGJlIG11bHRpLWxpbmUsIGFuZCB5b3UgY2FuIHBhc3NcbiMgdGhlIGN1cnJlbnQgaW5kZXggb2YgdGhlIGxvb3AgYXMgYSBzZWNvbmQgcGFyYW1ldGVyLiBVbmxpa2UgUnVieSBibG9ja3MsXG4jIHlvdSBjYW4gbWFwIGFuZCBmaWx0ZXIgaW4gYSBzaW5nbGUgcGFzcy5cblxuZXhwb3J0cy5Gb3IgPSBjbGFzcyBGb3IgZXh0ZW5kcyBXaGlsZVxuICAgIGNvbnN0cnVjdG9yOiAoYm9keSwgc291cmNlKSAtPlxuICAgICAgICB7QHNvdXJjZSwgQGd1YXJkLCBAc3RlcCwgQG5hbWUsIEBpbmRleH0gPSBzb3VyY2VcbiAgICAgICAgQGJvZHkgICA9IEJsb2NrLndyYXAgW2JvZHldXG4gICAgICAgIEBvd24gICAgPSAhIXNvdXJjZS5vd25cbiAgICAgICAgQG9iamVjdCA9ICEhc291cmNlLm9iamVjdFxuICAgICAgICBAZnJvbSAgID0gISFzb3VyY2UuZnJvbVxuICAgICAgICBAaW5kZXguZXJyb3IgJ2Nhbm5vdCB1c2UgaW5kZXggd2l0aCBmb3ItZnJvbScgaWYgQGZyb20gYW5kIEBpbmRleFxuICAgICAgICBzb3VyY2Uub3duVGFnLmVycm9yIFwiY2Fubm90IHVzZSBvd24gd2l0aCBmb3ItI3tpZiBAZnJvbSB0aGVuICdmcm9tJyBlbHNlICdpbid9XCIgaWYgQG93biBhbmQgbm90IEBvYmplY3RcbiAgICAgICAgW0BuYW1lLCBAaW5kZXhdID0gW0BpbmRleCwgQG5hbWVdIGlmIEBvYmplY3RcbiAgICAgICAgQGluZGV4LmVycm9yICdpbmRleCBjYW5ub3QgYmUgYSBwYXR0ZXJuIG1hdGNoaW5nIGV4cHJlc3Npb24nIGlmIEBpbmRleCBpbnN0YW5jZW9mIFZhbHVlIGFuZCBub3QgQGluZGV4LmlzQXNzaWduYWJsZSgpXG4gICAgICAgIEByYW5nZSAgID0gQHNvdXJjZSBpbnN0YW5jZW9mIFZhbHVlIGFuZCBAc291cmNlLmJhc2UgaW5zdGFuY2VvZiBSYW5nZSBhbmQgbm90IEBzb3VyY2UucHJvcGVydGllcy5sZW5ndGggYW5kIG5vdCBAZnJvbVxuICAgICAgICBAcGF0dGVybiA9IEBuYW1lIGluc3RhbmNlb2YgVmFsdWVcbiAgICAgICAgQGluZGV4LmVycm9yICdpbmRleGVzIGRvIG5vdCBhcHBseSB0byByYW5nZSBsb29wcycgaWYgQHJhbmdlIGFuZCBAaW5kZXhcbiAgICAgICAgQG5hbWUuZXJyb3IgJ2Nhbm5vdCBwYXR0ZXJuIG1hdGNoIG92ZXIgcmFuZ2UgbG9vcHMnIGlmIEByYW5nZSBhbmQgQHBhdHRlcm5cbiAgICAgICAgQHJldHVybnMgPSBmYWxzZVxuXG4gICAgY2hpbGRyZW46IFsnYm9keScsICdzb3VyY2UnLCAnZ3VhcmQnLCAnc3RlcCddXG5cbiAgICAjIFdlbGNvbWUgdG8gdGhlIGhhaXJpZXN0IG1ldGhvZCBpbiBhbGwgb2YgS29mZmVlLiBIYW5kbGVzIHRoZSBpbm5lclxuICAgICMgbG9vcCwgZmlsdGVyaW5nLCBzdGVwcGluZywgYW5kIHJlc3VsdCBzYXZpbmcgZm9yIGFycmF5LCBvYmplY3QsIGFuZCByYW5nZVxuICAgICMgY29tcHJlaGVuc2lvbnMuIFNvbWUgb2YgdGhlIGdlbmVyYXRlZCBjb2RlIGNhbiBiZSBzaGFyZWQgaW4gY29tbW9uLCBhbmRcbiAgICAjIHNvbWUgY2Fubm90LlxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgYm9keSAgICAgICAgPSBCbG9jay53cmFwIFtAYm9keV1cbiAgICAgICAgWy4uLiwgbGFzdF0gPSBib2R5LmV4cHJlc3Npb25zXG4gICAgICAgIEByZXR1cm5zICAgID0gbm8gaWYgbGFzdD8uanVtcHMoKSBpbnN0YW5jZW9mIFJldHVyblxuICAgICAgICBzb3VyY2UgICAgICA9IGlmIEByYW5nZSB0aGVuIEBzb3VyY2UuYmFzZSBlbHNlIEBzb3VyY2VcbiAgICAgICAgc2NvcGUgICAgICAgPSBvLnNjb3BlXG4gICAgICAgIG5hbWUgICAgICAgID0gQG5hbWUgIGFuZCAoQG5hbWUuY29tcGlsZSBvLCBMRVZFTF9MSVNUKSBpZiBub3QgQHBhdHRlcm5cbiAgICAgICAgaW5kZXggICAgICAgPSBAaW5kZXggYW5kIChAaW5kZXguY29tcGlsZSBvLCBMRVZFTF9MSVNUKVxuICAgICAgICBzY29wZS5maW5kKG5hbWUpICBpZiBuYW1lIGFuZCBub3QgQHBhdHRlcm5cbiAgICAgICAgc2NvcGUuZmluZChpbmRleCkgaWYgaW5kZXggYW5kIEBpbmRleCBub3QgaW5zdGFuY2VvZiBWYWx1ZVxuICAgICAgICBydmFyID0gc2NvcGUuZnJlZVZhcmlhYmxlICdyZXN1bHRzJyBpZiBAcmV0dXJuc1xuICAgICAgICBpZiBAZnJvbVxuICAgICAgICAgICAgaXZhciA9IHNjb3BlLmZyZWVWYXJpYWJsZSAneCcsIHNpbmdsZTogdHJ1ZSBpZiBAcGF0dGVyblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpdmFyID0gKEBvYmplY3QgYW5kIGluZGV4KSBvciBzY29wZS5mcmVlVmFyaWFibGUgJ2knLCBzaW5nbGU6IHRydWVcbiAgICAgICAga3ZhciA9ICgoQHJhbmdlIG9yIEBmcm9tKSBhbmQgbmFtZSkgb3IgaW5kZXggb3IgaXZhclxuICAgICAgICBrdmFyQXNzaWduICA9IGlmIGt2YXIgIT0gaXZhciB0aGVuIFwiI3trdmFyfSA9IFwiIGVsc2UgXCJcIlxuICAgICAgICBpZiBAc3RlcCBhbmQgbm90IEByYW5nZVxuICAgICAgICAgICAgW3N0ZXAsIHN0ZXBWYXJdID0gQGNhY2hlVG9Db2RlRnJhZ21lbnRzIEBzdGVwLmNhY2hlIG8sIExFVkVMX0xJU1QsIGlzQ29tcGxleE9yQXNzaWduYWJsZVxuICAgICAgICAgICAgc3RlcE51bSA9IE51bWJlciBzdGVwVmFyIGlmIEBzdGVwLmlzTnVtYmVyKClcbiAgICAgICAgbmFtZSAgICAgID0gaXZhciBpZiBAcGF0dGVyblxuICAgICAgICB2YXJQYXJ0ICAgPSAnJ1xuICAgICAgICBndWFyZFBhcnQgPSAnJ1xuICAgICAgICBkZWZQYXJ0ICAgPSAnJ1xuICAgICAgICBpZHQxICAgICAgPSBAdGFiICsgVEFCXG4gICAgICAgIGlmIEByYW5nZVxuICAgICAgICAgICAgZm9yUGFydEZyYWdtZW50cyA9IHNvdXJjZS5jb21waWxlVG9GcmFnbWVudHMgbWVyZ2UgbyxcbiAgICAgICAgICAgICAgICB7aW5kZXg6IGl2YXIsIG5hbWUsIEBzdGVwLCBpc0NvbXBsZXg6IGlzQ29tcGxleE9yQXNzaWduYWJsZX1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3ZhciA9IEBzb3VyY2UuY29tcGlsZSBvLCBMRVZFTF9MSVNUXG4gICAgICAgICAgICBpZiAobmFtZSBvciBAb3duKSBhbmQgQHNvdXJjZS51bndyYXAoKSBub3QgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbFxuICAgICAgICAgICAgICAgIGRlZlBhcnQgKz0gXCIje0B0YWJ9I3tyZWYgPSBzY29wZS5mcmVlVmFyaWFibGUgJ3JlZid9ID0gI3tzdmFyfTtcXG5cIlxuICAgICAgICAgICAgICAgIHN2YXIgPSByZWZcbiAgICAgICAgICAgIGlmIG5hbWUgYW5kIG5vdCBAcGF0dGVybiBhbmQgbm90IEBmcm9tXG4gICAgICAgICAgICAgICAgbmFtZVBhcnQgPSBcIiN7bmFtZX0gPSAje3N2YXJ9WyN7a3Zhcn1dXCJcbiAgICAgICAgICAgIGlmIG5vdCBAb2JqZWN0IGFuZCBub3QgQGZyb21cbiAgICAgICAgICAgICAgICBkZWZQYXJ0ICs9IFwiI3tAdGFifSN7c3RlcH07XFxuXCIgaWYgc3RlcCAhPSBzdGVwVmFyXG4gICAgICAgICAgICAgICAgZG93biA9IHN0ZXBOdW0gPCAwXG4gICAgICAgICAgICAgICAgbHZhciA9IHNjb3BlLmZyZWVWYXJpYWJsZSAnbGVuJyB1bmxlc3MgQHN0ZXAgYW5kIHN0ZXBOdW0/IGFuZCBkb3duXG4gICAgICAgICAgICAgICAgZGVjbGFyZSA9IFwiI3trdmFyQXNzaWdufSN7aXZhcn0gPSAwLCAje2x2YXJ9ID0gI3tzdmFyfS5sZW5ndGhcIlxuICAgICAgICAgICAgICAgIGRlY2xhcmVEb3duID0gXCIje2t2YXJBc3NpZ259I3tpdmFyfSA9ICN7c3Zhcn0ubGVuZ3RoIC0gMVwiXG4gICAgICAgICAgICAgICAgY29tcGFyZSA9IFwiI3tpdmFyfSA8ICN7bHZhcn1cIlxuICAgICAgICAgICAgICAgIGNvbXBhcmVEb3duID0gXCIje2l2YXJ9ID49IDBcIlxuICAgICAgICAgICAgICAgIGlmIEBzdGVwXG4gICAgICAgICAgICAgICAgICAgIGlmIHN0ZXBOdW0/XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkb3duXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyZSA9IGNvbXBhcmVEb3duXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjbGFyZSA9IGRlY2xhcmVEb3duXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhcmUgPSBcIiN7c3RlcFZhcn0gPiAwID8gI3tjb21wYXJlfSA6ICN7Y29tcGFyZURvd259XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY2xhcmUgPSBcIigje3N0ZXBWYXJ9ID4gMCA/ICgje2RlY2xhcmV9KSA6ICN7ZGVjbGFyZURvd259KVwiXG4gICAgICAgICAgICAgICAgICAgIGluY3JlbWVudCA9IFwiI3tpdmFyfSArPSAje3N0ZXBWYXJ9XCJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGluY3JlbWVudCA9IFwiI3tpZiBrdmFyICE9IGl2YXIgdGhlbiBcIisrI3tpdmFyfVwiIGVsc2UgXCIje2l2YXJ9KytcIn1cIlxuICAgICAgICAgICAgICAgIGZvclBhcnRGcmFnbWVudHMgPSBbQG1ha2VDb2RlKFwiI3tkZWNsYXJlfTsgI3tjb21wYXJlfTsgI3trdmFyQXNzaWdufSN7aW5jcmVtZW50fVwiKV1cbiAgICAgICAgaWYgQHJldHVybnNcbiAgICAgICAgICAgIHJlc3VsdFBhcnQgICA9IFwiI3tAdGFifSN7cnZhcn0gPSBbXTtcXG5cIlxuICAgICAgICAgICAgcmV0dXJuUmVzdWx0ID0gXCJcXG4je0B0YWJ9cmV0dXJuICN7cnZhcn07XCJcbiAgICAgICAgICAgIGJvZHkubWFrZVJldHVybiBydmFyXG4gICAgICAgIGlmIEBndWFyZFxuICAgICAgICAgICAgaWYgYm9keS5leHByZXNzaW9ucy5sZW5ndGggPiAxXG4gICAgICAgICAgICAgICAgYm9keS5leHByZXNzaW9ucy51bnNoaWZ0IG5ldyBJZiAobmV3IFBhcmVucyBAZ3VhcmQpLmludmVydCgpLCBuZXcgU3RhdGVtZW50TGl0ZXJhbCBcImNvbnRpbnVlXCJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBib2R5ID0gQmxvY2sud3JhcCBbbmV3IElmIEBndWFyZCwgYm9keV0gaWYgQGd1YXJkXG4gICAgICAgIGlmIEBwYXR0ZXJuXG4gICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zLnVuc2hpZnQgbmV3IEFzc2lnbiBAbmFtZSwgaWYgQGZyb20gdGhlbiBuZXcgSWRlbnRpZmllckxpdGVyYWwga3ZhciBlbHNlIG5ldyBMaXRlcmFsIFwiI3tzdmFyfVsje2t2YXJ9XVwiXG4gICAgICAgIGRlZlBhcnRGcmFnbWVudHMgPSBbXS5jb25jYXQgQG1ha2VDb2RlKGRlZlBhcnQpLCBAcGx1Y2tEaXJlY3RDYWxsKG8sIGJvZHkpXG4gICAgICAgIHZhclBhcnQgPSBcIlxcbiN7aWR0MX0je25hbWVQYXJ0fTtcIiBpZiBuYW1lUGFydFxuICAgICAgICBpZiBAb2JqZWN0XG4gICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzID0gW0BtYWtlQ29kZShcIiN7a3Zhcn0gaW4gI3tzdmFyfVwiKV1cbiAgICAgICAgICAgIGd1YXJkUGFydCA9IFwiXFxuI3tpZHQxfWlmICghI3t1dGlsaXR5ICdoYXNQcm9wJywgb30uY2FsbCgje3N2YXJ9LCAje2t2YXJ9KSkgY29udGludWU7XCIgaWYgQG93blxuICAgICAgICBlbHNlIGlmIEBmcm9tXG4gICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzID0gW0BtYWtlQ29kZShcIiN7a3Zhcn0gb2YgI3tzdmFyfVwiKV1cbiAgICAgICAgYm9keUZyYWdtZW50cyA9IGJvZHkuY29tcGlsZVRvRnJhZ21lbnRzIG1lcmdlKG8sIGluZGVudDogaWR0MSksIExFVkVMX1RPUFxuICAgICAgICBpZiBib2R5RnJhZ21lbnRzIGFuZCBib2R5RnJhZ21lbnRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGJvZHlGcmFnbWVudHMgPSBbXS5jb25jYXQgQG1ha2VDb2RlKFwiXFxuXCIpLCBib2R5RnJhZ21lbnRzLCBAbWFrZUNvZGUoXCJcXG5cIilcbiAgICAgICAgW10uY29uY2F0IGRlZlBhcnRGcmFnbWVudHMsIEBtYWtlQ29kZShcIiN7cmVzdWx0UGFydCBvciAnJ30je0B0YWJ9Zm9yIChcIiksXG4gICAgICAgICAgICBmb3JQYXJ0RnJhZ21lbnRzLCBAbWFrZUNvZGUoXCIpIHsje2d1YXJkUGFydH0je3ZhclBhcnR9XCIpLCBib2R5RnJhZ21lbnRzLFxuICAgICAgICAgICAgQG1ha2VDb2RlKFwiI3tAdGFifX0je3JldHVyblJlc3VsdCBvciAnJ31cIilcblxuICAgIHBsdWNrRGlyZWN0Q2FsbDogKG8sIGJvZHkpIC0+XG4gICAgICAgIGRlZnMgPSBbXVxuICAgICAgICBmb3IgZXhwciwgaWR4IGluIGJvZHkuZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGV4cHIgPSBleHByLnVud3JhcEFsbCgpXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgZXhwciBpbnN0YW5jZW9mIENhbGxcbiAgICAgICAgICAgIHZhbCA9IGV4cHIudmFyaWFibGU/LnVud3JhcEFsbCgpXG4gICAgICAgICAgICBjb250aW51ZSB1bmxlc3MgKHZhbCBpbnN0YW5jZW9mIENvZGUpIG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh2YWwgaW5zdGFuY2VvZiBWYWx1ZSBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsLmJhc2U/LnVud3JhcEFsbCgpIGluc3RhbmNlb2YgQ29kZSBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsLnByb3BlcnRpZXMubGVuZ3RoIGlzIDEgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbC5wcm9wZXJ0aWVzWzBdLm5hbWU/LnZhbHVlIGluIFsnY2FsbCcsICdhcHBseSddKVxuICAgICAgICAgICAgZm4gICAgICA9IHZhbC5iYXNlPy51bndyYXBBbGwoKSBvciB2YWxcbiAgICAgICAgICAgIHJlZiAgICAgPSBuZXcgSWRlbnRpZmllckxpdGVyYWwgby5zY29wZS5mcmVlVmFyaWFibGUgJ2ZuJ1xuICAgICAgICAgICAgYmFzZSAgICA9IG5ldyBWYWx1ZSByZWZcbiAgICAgICAgICAgIGlmIHZhbC5iYXNlXG4gICAgICAgICAgICAgICAgW3ZhbC5iYXNlLCBiYXNlXSA9IFtiYXNlLCB2YWxdXG4gICAgICAgICAgICBib2R5LmV4cHJlc3Npb25zW2lkeF0gPSBuZXcgQ2FsbCBiYXNlLCBleHByLmFyZ3NcbiAgICAgICAgICAgIGRlZnMgPSBkZWZzLmNvbmNhdCBAbWFrZUNvZGUoQHRhYiksIChuZXcgQXNzaWduKHJlZiwgZm4pLmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9UT1ApKSwgQG1ha2VDb2RlKCc7XFxuJylcbiAgICAgICAgZGVmc1xuXG4jICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgXG4jICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuXG4jIEEgSmF2YVNjcmlwdCAqc3dpdGNoKiBzdGF0ZW1lbnQuIENvbnZlcnRzIGludG8gYSByZXR1cm5hYmxlIGV4cHJlc3Npb24gb24tZGVtYW5kLlxuXG5leHBvcnRzLlN3aXRjaCA9IGNsYXNzIFN3aXRjaCBleHRlbmRzIEJhc2VcbiAgICBjb25zdHJ1Y3RvcjogKEBzdWJqZWN0LCBAY2FzZXMsIEBvdGhlcndpc2UpIC0+XG5cbiAgICBjaGlsZHJlbjogWydzdWJqZWN0JywgJ2Nhc2VzJywgJ290aGVyd2lzZSddXG5cbiAgICBpc1N0YXRlbWVudDogWUVTXG5cbiAgICBqdW1wczogKG8gPSB7YmxvY2s6IHllc30pIC0+XG4gICAgICAgIGZvciBbY29uZHMsIGJsb2NrXSBpbiBAY2FzZXNcbiAgICAgICAgICAgIHJldHVybiBqdW1wTm9kZSBpZiBqdW1wTm9kZSA9IGJsb2NrLmp1bXBzIG9cbiAgICAgICAgQG90aGVyd2lzZT8uanVtcHMgb1xuXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgcGFpclsxXS5tYWtlUmV0dXJuIHJlcyBmb3IgcGFpciBpbiBAY2FzZXNcbiAgICAgICAgQG90aGVyd2lzZSBvcj0gbmV3IEJsb2NrIFtuZXcgTGl0ZXJhbCAndm9pZCAwJ10gaWYgcmVzXG4gICAgICAgIEBvdGhlcndpc2U/Lm1ha2VSZXR1cm4gcmVzXG4gICAgICAgIHRoaXNcblxuICAgIGNvbXBpbGVOb2RlOiAobykgLT5cbiAgICAgICAgaWR0MSA9IG8uaW5kZW50ICsgVEFCXG4gICAgICAgIGlkdDIgPSBvLmluZGVudCA9IGlkdDEgKyBUQUJcbiAgICAgICAgZnJhZ21lbnRzID0gW10uY29uY2F0IEBtYWtlQ29kZShAdGFiICsgXCJzd2l0Y2ggKFwiKSxcbiAgICAgICAgICAgIChpZiBAc3ViamVjdCB0aGVuIEBzdWJqZWN0LmNvbXBpbGVUb0ZyYWdtZW50cyhvLCBMRVZFTF9QQVJFTikgZWxzZSBAbWFrZUNvZGUgXCJmYWxzZVwiKSxcbiAgICAgICAgICAgIEBtYWtlQ29kZShcIikge1xcblwiKVxuICAgICAgICBmb3IgW2NvbmRpdGlvbnMsIGJsb2NrXSwgaSBpbiBAY2FzZXNcbiAgICAgICAgICAgIGZvciBjb25kIGluIGZsYXR0ZW4gW2NvbmRpdGlvbnNdXG4gICAgICAgICAgICAgICAgY29uZCAgICA9IGNvbmQuaW52ZXJ0KCkgdW5sZXNzIEBzdWJqZWN0XG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzID0gZnJhZ21lbnRzLmNvbmNhdCBAbWFrZUNvZGUoaWR0MSArIFwiY2FzZSBcIiksIGNvbmQuY29tcGlsZVRvRnJhZ21lbnRzKG8sIExFVkVMX1BBUkVOKSwgQG1ha2VDb2RlKFwiOlxcblwiKVxuICAgICAgICAgICAgZnJhZ21lbnRzID0gZnJhZ21lbnRzLmNvbmNhdCBib2R5LCBAbWFrZUNvZGUoJ1xcbicpIGlmIChib2R5ID0gYmxvY2suY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX1RPUCkubGVuZ3RoID4gMFxuICAgICAgICAgICAgYnJlYWsgaWYgaSBpcyBAY2FzZXMubGVuZ3RoIC0gMSBhbmQgbm90IEBvdGhlcndpc2VcbiAgICAgICAgICAgIGV4cHIgPSBAbGFzdE5vbkNvbW1lbnQgYmxvY2suZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIGV4cHIgaW5zdGFuY2VvZiBSZXR1cm4gb3IgKGV4cHIgaW5zdGFuY2VvZiBMaXRlcmFsIGFuZCBleHByLmp1bXBzKCkgYW5kIGV4cHIudmFsdWUgIT0gJ2RlYnVnZ2VyJylcbiAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoIGNvbmQubWFrZUNvZGUoaWR0MiArICdicmVhaztcXG4nKVxuICAgICAgICBpZiBAb3RoZXJ3aXNlIGFuZCBAb3RoZXJ3aXNlLmV4cHJlc3Npb25zLmxlbmd0aFxuICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2ggQG1ha2VDb2RlKGlkdDEgKyBcImRlZmF1bHQ6XFxuXCIpLCAoQG90aGVyd2lzZS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QKS4uLiwgQG1ha2VDb2RlKFwiXFxuXCIpXG4gICAgICAgIGZyYWdtZW50cy5wdXNoIEBtYWtlQ29kZSBAdGFiICsgJ30nXG4gICAgICAgIGZyYWdtZW50c1xuXG4jIDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgIDAwMCAgICAgICBcbiMgMDAwICAwMDAwMDAgICAgXG4jIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgIDAwMCAgICAgICBcblxuIyAqSWYvZWxzZSogc3RhdGVtZW50cy4gQWN0cyBhcyBhbiBleHByZXNzaW9uIGJ5IHB1c2hpbmcgZG93biByZXF1ZXN0ZWQgcmV0dXJucyB0byB0aGUgbGFzdCBsaW5lIG9mIGVhY2ggY2xhdXNlLlxuI1xuIyBTaW5nbGUtZXhwcmVzc2lvbiAqKklmcyoqIGFyZSBjb21waWxlZCBpbnRvIGNvbmRpdGlvbmFsIG9wZXJhdG9ycyBpZiBwb3NzaWJsZSxcbiMgYmVjYXVzZSB0ZXJuYXJpZXMgYXJlIGFscmVhZHkgcHJvcGVyIGV4cHJlc3Npb25zLCBhbmQgZG9uJ3QgbmVlZCBjb252ZXJzaW9uLlxuXG5leHBvcnRzLklmID0gY2xhc3MgSWYgZXh0ZW5kcyBCYXNlXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChjb25kaXRpb24sIEBib2R5LCBvcHRpb25zID0ge30pIC0+XG4gICAgICAgIEBjb25kaXRpb24gPSBpZiBvcHRpb25zLnR5cGUgaXMgJ3VubGVzcycgdGhlbiBjb25kaXRpb24uaW52ZXJ0KCkgZWxzZSBjb25kaXRpb25cbiAgICAgICAgQGVsc2VCb2R5ICAgID0gbnVsbFxuICAgICAgICBAaXNDaGFpbiAgICAgPSBmYWxzZVxuICAgICAgICB7QHNvYWt9ICAgICAgPSBvcHRpb25zXG5cbiAgICBjaGlsZHJlbjogWydjb25kaXRpb24nLCAnYm9keScsICdlbHNlQm9keSddXG5cbiAgICBib2R5Tm9kZTogICAgICAgICAgIC0+IEBib2R5Py51bndyYXAoKVxuICAgIGVsc2VCb2R5Tm9kZTogLT4gQGVsc2VCb2R5Py51bndyYXAoKVxuXG4gICAgIyBSZXdyaXRlIGEgY2hhaW4gb2YgKipJZnMqKiB0byBhZGQgYSBkZWZhdWx0IGNhc2UgYXMgdGhlIGZpbmFsICplbHNlKi5cbiAgICBcbiAgICBhZGRFbHNlOiAoZWxzZUJvZHkpIC0+XG4gICAgICAgIGlmIEBpc0NoYWluXG4gICAgICAgICAgICBAZWxzZUJvZHlOb2RlKCkuYWRkRWxzZSBlbHNlQm9keVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaXNDaGFpbiAgICA9IGVsc2VCb2R5IGluc3RhbmNlb2YgSWZcbiAgICAgICAgICAgIEBlbHNlQm9keSA9IEBlbnN1cmVCbG9jayBlbHNlQm9keVxuICAgICAgICAgICAgQGVsc2VCb2R5LnVwZGF0ZUxvY2F0aW9uRGF0YUlmTWlzc2luZyBlbHNlQm9keS5sb2NhdGlvbkRhdGFcbiAgICAgICAgdGhpc1xuXG4gICAgIyBUaGUgKipJZioqIG9ubHkgY29tcGlsZXMgaW50byBhIHN0YXRlbWVudCBpZiBlaXRoZXIgb2YgaXRzIGJvZGllcyBuZWVkc1xuICAgICMgdG8gYmUgYSBzdGF0ZW1lbnQuIE90aGVyd2lzZSBhIGNvbmRpdGlvbmFsIG9wZXJhdG9yIGlzIHNhZmUuXG4gICAgXG4gICAgaXNTdGF0ZW1lbnQ6IChvKSAtPlxuICAgICAgICBvPy5sZXZlbCBpcyBMRVZFTF9UT1Agb3JcbiAgICAgICAgICAgIEBib2R5Tm9kZSgpLmlzU3RhdGVtZW50KG8pIG9yIEBlbHNlQm9keU5vZGUoKT8uaXNTdGF0ZW1lbnQobylcblxuICAgIGp1bXBzOiAobykgLT4gQGJvZHkuanVtcHMobykgb3IgQGVsc2VCb2R5Py5qdW1wcyhvKVxuXG4gICAgY29tcGlsZU5vZGU6IChvKSAtPlxuICAgICAgICBpZiBAaXNTdGF0ZW1lbnQgbyB0aGVuIEBjb21waWxlU3RhdGVtZW50IG8gZWxzZSBAY29tcGlsZUV4cHJlc3Npb24gb1xuXG4gICAgbWFrZVJldHVybjogKHJlcykgLT5cbiAgICAgICAgQGVsc2VCb2R5ICAgIG9yPSBuZXcgQmxvY2sgW25ldyBMaXRlcmFsICd2b2lkIDAnXSBpZiByZXNcbiAgICAgICAgQGJvZHkgICAgICAgICAgIGFuZD0gbmV3IEJsb2NrIFtAYm9keS5tYWtlUmV0dXJuIHJlc11cbiAgICAgICAgQGVsc2VCb2R5IGFuZD0gbmV3IEJsb2NrIFtAZWxzZUJvZHkubWFrZVJldHVybiByZXNdXG4gICAgICAgIHRoaXNcblxuICAgIGVuc3VyZUJsb2NrOiAobm9kZSkgLT5cbiAgICAgICAgaWYgbm9kZSBpbnN0YW5jZW9mIEJsb2NrIHRoZW4gbm9kZSBlbHNlIG5ldyBCbG9jayBbbm9kZV1cblxuICAgICMgQ29tcGlsZSB0aGUgYElmYCBhcyBhIHJlZ3VsYXIgKmlmLWVsc2UqIHN0YXRlbWVudC4gRmxhdHRlbmVkIGNoYWlucyBmb3JjZSBpbm5lciAqZWxzZSogYm9kaWVzIGludG8gc3RhdGVtZW50IGZvcm0uXG4gICAgY29tcGlsZVN0YXRlbWVudDogKG8pIC0+XG4gICAgICAgIGNoaWxkICAgICAgICA9IGRlbCBvLCAnY2hhaW5DaGlsZCdcbiAgICAgICAgZXhlcSAgICAgICAgID0gZGVsIG8sICdpc0V4aXN0ZW50aWFsRXF1YWxzJ1xuXG4gICAgICAgIGlmIGV4ZXFcbiAgICAgICAgICAgIHJldHVybiBuZXcgSWYoQGNvbmRpdGlvbi5pbnZlcnQoKSwgQGVsc2VCb2R5Tm9kZSgpLCB0eXBlOiAnaWYnKS5jb21waWxlVG9GcmFnbWVudHMgb1xuXG4gICAgICAgIGluZGVudCAgID0gby5pbmRlbnQgKyBUQUJcbiAgICAgICAgY29uZCAgICAgICAgID0gQGNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfUEFSRU5cbiAgICAgICAgYm9keSAgICAgICAgID0gQGVuc3VyZUJsb2NrKEBib2R5KS5jb21waWxlVG9GcmFnbWVudHMgbWVyZ2Ugbywge2luZGVudH1cbiAgICAgICAgaWZQYXJ0ICAgPSBbXS5jb25jYXQgQG1ha2VDb2RlKFwiaWYgKFwiKSwgY29uZCwgQG1ha2VDb2RlKFwiKSB7XFxuXCIpLCBib2R5LCBAbWFrZUNvZGUoXCJcXG4je0B0YWJ9fVwiKVxuICAgICAgICBpZlBhcnQudW5zaGlmdCBAbWFrZUNvZGUgQHRhYiB1bmxlc3MgY2hpbGRcbiAgICAgICAgcmV0dXJuIGlmUGFydCB1bmxlc3MgQGVsc2VCb2R5XG4gICAgICAgIGFuc3dlciA9IGlmUGFydC5jb25jYXQgQG1ha2VDb2RlKCcgZWxzZSAnKVxuICAgICAgICBpZiBAaXNDaGFpblxuICAgICAgICAgICAgby5jaGFpbkNoaWxkID0geWVzXG4gICAgICAgICAgICBhbnN3ZXIgPSBhbnN3ZXIuY29uY2F0IEBlbHNlQm9keS51bndyYXAoKS5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfVE9QXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGFuc3dlciA9IGFuc3dlci5jb25jYXQgQG1ha2VDb2RlKFwie1xcblwiKSwgQGVsc2VCb2R5LmNvbXBpbGVUb0ZyYWdtZW50cyhtZXJnZShvLCB7aW5kZW50fSksIExFVkVMX1RPUCksIEBtYWtlQ29kZShcIlxcbiN7QHRhYn19XCIpXG4gICAgICAgIGFuc3dlclxuXG4gICAgIyBDb21waWxlIHRoZSBgSWZgIGFzIGEgY29uZGl0aW9uYWwgb3BlcmF0b3IuXG4gICAgY29tcGlsZUV4cHJlc3Npb246IChvKSAtPlxuICAgICAgICBjb25kID0gQGNvbmRpdGlvbi5jb21waWxlVG9GcmFnbWVudHMgbywgTEVWRUxfQ09ORFxuICAgICAgICBib2R5ID0gQGJvZHlOb2RlKCkuY29tcGlsZVRvRnJhZ21lbnRzIG8sIExFVkVMX0xJU1RcbiAgICAgICAgYWx0ICA9IGlmIEBlbHNlQm9keU5vZGUoKSB0aGVuIEBlbHNlQm9keU5vZGUoKS5jb21waWxlVG9GcmFnbWVudHMobywgTEVWRUxfTElTVCkgZWxzZSBbQG1ha2VDb2RlKCd2b2lkIDAnKV1cbiAgICAgICAgZnJhZ21lbnRzID0gY29uZC5jb25jYXQgQG1ha2VDb2RlKFwiID8gXCIpLCBib2R5LCBAbWFrZUNvZGUoXCIgOiBcIiksIGFsdFxuICAgICAgICBpZiBvLmxldmVsID49IExFVkVMX0NPTkQgdGhlbiBAd3JhcEluQnJhY2VzIGZyYWdtZW50cyBlbHNlIGZyYWdtZW50c1xuXG4gICAgdW5mb2xkU29hazogLT5cbiAgICAgICAgQHNvYWsgYW5kIHRoaXNcblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG5cblVUSUxJVElFUyA9XG5cbiAgICAjIENvcnJlY3RseSBzZXQgdXAgYSBwcm90b3R5cGUgY2hhaW4gZm9yIGluaGVyaXRhbmNlLCBpbmNsdWRpbmcgYSByZWZlcmVuY2VcbiAgICAjIHRvIHRoZSBzdXBlcmNsYXNzIGZvciBgc3VwZXIoKWAgY2FsbHMsIGFuZCBjb3BpZXMgb2YgYW55IHN0YXRpYyBwcm9wZXJ0aWVzLlxuICAgICAgICBcbiAgICBleHRlbmQ6IChvKSAtPiBcIlxuICAgICAgICBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCN7dXRpbGl0eSAnaGFzUHJvcCcsIG99LmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICAgICAgICAgIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gICAgICAgICAgICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgICAgICB9XG4gICAgXCJcblxuICAgICMgQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gdGhlIGN1cnJlbnQgdmFsdWUgb2YgXCJ0aGlzXCIuXG4gICAgYmluZDogLT4gJ1xuICAgICAgICBmdW5jdGlvbihmbiwgbWUpe1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICdcblxuICAgICMgRGlzY292ZXIgaWYgYW4gaXRlbSBpcyBpbiBhbiBhcnJheS5cbiAgICBpbmRleE9mOiAtPiBcIlxuICAgICAgICBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgXCJcblxuICAgIG1vZHVsbzogLT4gXCJcIlwiXG4gICAgICAgIGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuICgrYSAlIChiID0gK2IpICsgYikgJSBiOyB9XG4gICAgXCJcIlwiXG5cbiAgICAjIFNob3J0Y3V0cyB0byBzcGVlZCB1cCB0aGUgbG9va3VwIHRpbWUgZm9yIG5hdGl2ZSBmdW5jdGlvbnMuXG4gICAgaGFzUHJvcDogLT4gJ3t9Lmhhc093blByb3BlcnR5J1xuICAgIHNsaWNlOiAtPiAnW10uc2xpY2UnXG5cbiMgTGV2ZWxzIGluZGljYXRlIGEgbm9kZSdzIHBvc2l0aW9uIGluIHRoZSBBU1QuIFVzZWZ1bCBmb3Iga25vd2luZyBpZlxuIyBwYXJlbnMgYXJlIG5lY2Vzc2FyeSBvciBzdXBlcmZsdW91cy5cbkxFVkVMX1RPUCAgICA9IDEgICAgIyAuLi47XG5MRVZFTF9QQVJFTiAgPSAyICAgICMgKC4uLilcbkxFVkVMX0xJU1QgICA9IDMgICAgIyBbLi4uXVxuTEVWRUxfQ09ORCAgID0gNCAgICAjIC4uLiA/IHggOiB5XG5MRVZFTF9PUCAgICAgPSA1ICAgICMgIS4uLlxuTEVWRUxfQUNDRVNTID0gNiAgICAjIC4uLlswXVxuXG5UQUIgPSAnICAgICcgIyBUYWJzIGFyZSA0IHNwYWNlcyBmb3IgcHJldHR5IHByaW50aW5nLlxuXG5TSU1QTEVOVU0gPSAvXlsrLV0/XFxkKyQvXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcblxuIyBIZWxwZXIgZm9yIGVuc3VyaW5nIHRoYXQgdXRpbGl0eSBmdW5jdGlvbnMgYXJlIGFzc2lnbmVkIGF0IHRoZSB0b3AgbGV2ZWwuXG4gICAgXG51dGlsaXR5ID0gKG5hbWUsIG8pIC0+XG4gICAge3Jvb3R9ID0gby5zY29wZVxuICAgIGlmIG5hbWUgb2Ygcm9vdC51dGlsaXRpZXNcbiAgICAgICAgcm9vdC51dGlsaXRpZXNbbmFtZV1cbiAgICBlbHNlXG4gICAgICAgIHJlZiA9IHJvb3QuZnJlZVZhcmlhYmxlIG5hbWVcbiAgICAgICAgcm9vdC5hc3NpZ24gcmVmLCBVVElMSVRJRVNbbmFtZV0gb1xuICAgICAgICByb290LnV0aWxpdGllc1tuYW1lXSA9IHJlZlxuXG5tdWx0aWRlbnQgPSAoY29kZSwgdGFiKSAtPlxuICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UgL1xcbi9nLCAnJCYnICsgdGFiXG4gICAgY29kZS5yZXBsYWNlIC9cXHMrJC8sICcnXG5cbmlzTGl0ZXJhbEFyZ3VtZW50cyA9IChub2RlKSAtPlxuICAgIG5vZGUgaW5zdGFuY2VvZiBJZGVudGlmaWVyTGl0ZXJhbCBhbmQgbm9kZS52YWx1ZSBpcyAnYXJndW1lbnRzJ1xuXG5pc0xpdGVyYWxUaGlzID0gKG5vZGUpIC0+XG4gICAgbm9kZSBpbnN0YW5jZW9mIFRoaXNMaXRlcmFsIG9yXG4gICAgICAgIChub2RlIGluc3RhbmNlb2YgQ29kZSBhbmQgbm9kZS5ib3VuZCkgb3JcbiAgICAgICAgbm9kZSBpbnN0YW5jZW9mIFN1cGVyQ2FsbFxuXG5pc0NvbXBsZXhPckFzc2lnbmFibGUgPSAobm9kZSkgLT4gbm9kZS5pc0NvbXBsZXgoKSBvciBub2RlLmlzQXNzaWduYWJsZT8oKVxuXG4jIFVuZm9sZCBhIG5vZGUncyBjaGlsZCBpZiBzb2FrLCB0aGVuIHR1Y2sgdGhlIG5vZGUgdW5kZXIgY3JlYXRlZCBgSWZgXG51bmZvbGRTb2FrID0gKG8sIHBhcmVudCwgbmFtZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGlmbiA9IHBhcmVudFtuYW1lXS51bmZvbGRTb2FrIG9cbiAgICBwYXJlbnRbbmFtZV0gPSBpZm4uYm9keVxuICAgIGlmbi5ib2R5ID0gbmV3IFZhbHVlIHBhcmVudFxuICAgIGlmblxuIl19
//# sourceURL=../src/nodes.coffee