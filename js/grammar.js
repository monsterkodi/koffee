// koffee 1.4.0

/*
 0000000   00000000    0000000   00     00  00     00   0000000   00000000   
000        000   000  000   000  000   000  000   000  000   000  000   000  
000  0000  0000000    000000000  000000000  000000000  000000000  0000000    
000   000  000   000  000   000  000 0 000  000 0 000  000   000  000   000  
 0000000   000   000  000   000  000   000  000   000  000   000  000   000
 */
var Parser, alt, alternatives, grammar, name, o, operators, token, tokens, unwrap;

Parser = require('jison').Parser;

unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;

o = function(patternString, action, options) {
    var addLocationDataFn, match, patternCount;
    patternString = patternString.replace(/\s{2,}/g, ' ');
    patternCount = patternString.split(' ').length;
    if (!action) {
        return [patternString, '$$ = $1;', options];
    }
    action = (match = unwrap.exec(action)) ? match[1] : "(" + action + "())";
    action = action.replace(/\bnew /g, '$&yy.');
    action = action.replace(/\b(?:Block\.wrap|extend)\b/g, 'yy.$&');
    addLocationDataFn = function(first, last) {
        if (!last) {
            return "yy.addLocationDataFn(@" + first + ")";
        } else {
            return "yy.addLocationDataFn(@" + first + ", @" + last + ")";
        }
    };
    action = action.replace(/LOC\(([0-9]*)\)/g, addLocationDataFn('$1'));
    action = action.replace(/LOC\(([0-9]*),\s*([0-9]*)\)/g, addLocationDataFn('$1', '$2'));
    return [patternString, "$$ = " + (addLocationDataFn(1, patternCount)) + "(" + action + ");", options];
};

grammar = {
    Root: [
        o('', function() {
            return new Block;
        }), o('Body')
    ],
    Body: [
        o('Line', function() {
            return Block.wrap([$1]);
        }), o('Body TERMINATOR Line', function() {
            return $1.push($3);
        }), o('Body TERMINATOR')
    ],
    Line: [o('Expression'), o('Statement'), o('YieldReturn')],
    Statement: [
        o('Return'), o('Comment'), o('STATEMENT', function() {
            return new StatementLiteral($1);
        }), o('Import'), o('Export')
    ],
    Expression: [o('Value'), o('Invocation'), o('Code'), o('Operation'), o('Assign'), o('If'), o('MetaIf'), o('Try'), o('While'), o('For'), o('Switch'), o('Class'), o('Throw'), o('Yield')],
    Yield: [
        o('YIELD', function() {
            return new Op($1, new Value(new Literal('')));
        }), o('YIELD Expression', function() {
            return new Op($1, $2);
        }), o('YIELD FROM Expression', function() {
            return new Op($1.concat($2), $3);
        })
    ],
    Block: [
        o('INDENT OUTDENT', function() {
            return new Block;
        }), o('INDENT Body OUTDENT', function() {
            return $2;
        })
    ],
    Identifier: [
        o('IDENTIFIER', function() {
            return new IdentifierLiteral($1);
        })
    ],
    Property: [
        o('PROPERTY', function() {
            return new PropertyName($1);
        })
    ],
    AlphaNumeric: [
        o('NUMBER', function() {
            return new NumberLiteral($1);
        }), o('String')
    ],
    String: [
        o('STRING', function() {
            return new StringLiteral($1);
        }), o('STRING_START Body STRING_END', function() {
            return new StringWithInterpolations($2);
        })
    ],
    Regex: [
        o('REGEX', function() {
            return new RegexLiteral($1);
        }), o('REGEX_START Invocation REGEX_END', function() {
            return new RegexWithInterpolations($2.args);
        })
    ],
    Literal: [
        o('AlphaNumeric'), o('JS', function() {
            return new PassthroughLiteral($1);
        }), o('Regex'), o('UNDEFINED', function() {
            return new UndefinedLiteral;
        }), o('NULL', function() {
            return new NullLiteral;
        }), o('BOOL', function() {
            return new BooleanLiteral($1);
        }), o('INFINITY', function() {
            return new InfinityLiteral($1);
        }), o('NAN', function() {
            return new NaNLiteral;
        })
    ],
    Assign: [
        o('Assignable = Expression', function() {
            return new Assign($1, $3);
        }), o('Assignable = TERMINATOR Expression', function() {
            return new Assign($1, $4);
        }), o('Assignable = INDENT Expression OUTDENT', function() {
            return new Assign($1, $4);
        })
    ],
    AssignObj: [
        o('ObjAssignable', function() {
            return new Value($1);
        }), o('ObjAssignable : Expression', function() {
            return new Assign(LOC(1)(new Value($1)), $3, 'object', {
                operatorToken: LOC(2)(new Literal($2))
            });
        }), o('ObjAssignable : INDENT Expression OUTDENT', function() {
            return new Assign(LOC(1)(new Value($1)), $4, 'object', {
                operatorToken: LOC(2)(new Literal($2))
            });
        }), o('SimpleObjAssignable = Expression', function() {
            return new Assign(LOC(1)(new Value($1)), $3, null, {
                operatorToken: LOC(2)(new Literal($2))
            });
        }), o('SimpleObjAssignable = INDENT Expression OUTDENT', function() {
            return new Assign(LOC(1)(new Value($1)), $4, null, {
                operatorToken: LOC(2)(new Literal($2))
            });
        }), o('Comment')
    ],
    SimpleObjAssignable: [o('Identifier'), o('Property'), o('ThisProperty')],
    ObjAssignable: [o('SimpleObjAssignable'), o('AlphaNumeric')],
    Return: [
        o('RETURN Expression', function() {
            return new Return($2);
        }), o('RETURN INDENT Object OUTDENT', function() {
            return new Return(new Value($3));
        }), o('RETURN', function() {
            return new Return;
        })
    ],
    YieldReturn: [
        o('YIELD RETURN Expression', function() {
            return new YieldReturn($3);
        }), o('YIELD RETURN', function() {
            return new YieldReturn;
        })
    ],
    Comment: [
        o('HERECOMMENT', function() {
            return new Comment($1);
        })
    ],
    Code: [
        o('PARAM_START ParamList PARAM_END FuncGlyph Block', function() {
            return new Code($2, $5, $4);
        }), o('FuncGlyph Block', function() {
            return new Code([], $2, $1);
        })
    ],
    FuncGlyph: [
        o('->', function() {
            return 'func';
        }), o('=>', function() {
            return 'boundfunc';
        })
    ],
    OptComma: [o(''), o(',')],
    ParamList: [
        o('', function() {
            return [];
        }), o('Param', function() {
            return [$1];
        }), o('ParamList , Param', function() {
            return $1.concat($3);
        }), o('ParamList OptComma TERMINATOR Param', function() {
            return $1.concat($4);
        }), o('ParamList OptComma INDENT ParamList OptComma OUTDENT', function() {
            return $1.concat($4);
        })
    ],
    Param: [
        o('ParamVar', function() {
            return new Param($1);
        }), o('ParamVar ...', function() {
            return new Param($1, null, true);
        }), o('ParamVar = Expression', function() {
            return new Param($1, $3);
        }), o('...', function() {
            return new Expansion;
        })
    ],
    ParamVar: [o('Identifier'), o('ThisProperty'), o('Array'), o('Object')],
    Splat: [
        o('Expression ...', function() {
            return new Splat($1);
        })
    ],
    SimpleAssignable: [
        o('Identifier', function() {
            return new Value($1);
        }), o('Value Accessor', function() {
            return $1.add($2);
        }), o('Invocation Accessor', function() {
            return new Value($1, [].concat($2));
        }), o('ThisProperty')
    ],
    Assignable: [
        o('SimpleAssignable'), o('Array', function() {
            return new Value($1);
        }), o('Object', function() {
            return new Value($1);
        })
    ],
    Value: [
        o('Assignable'), o('Literal', function() {
            return new Value($1);
        }), o('Parenthetical', function() {
            return new Value($1);
        }), o('Range', function() {
            return new Value($1);
        }), o('This')
    ],
    Accessor: [
        o('.   Property', function() {
            return new Access($2);
        }), o('?.  Property', function() {
            return new Access($2, 'soak');
        }), o('::  Property', function() {
            return [LOC(1)(new Access(new PropertyName('prototype'))), LOC(2)(new Access($2))];
        }), o('?:: Property', function() {
            return [LOC(1)(new Access(new PropertyName('prototype'), 'soak')), LOC(2)(new Access($2))];
        }), o('::', function() {
            return new Access(new PropertyName('prototype'));
        }), o('Index')
    ],
    Index: [
        o('INDEX_START IndexValue INDEX_END', function() {
            return $2;
        }), o('INDEX_SOAK    Index', function() {
            return extend($2, {
                soak: true
            });
        })
    ],
    IndexValue: [
        o('Expression', function() {
            return new Index($1);
        }), o('Slice', function() {
            return new Slice($1);
        })
    ],
    Object: [
        o('{ AssignList OptComma }', function() {
            return new Obj($2, $1.generated);
        })
    ],
    AssignList: [
        o('', function() {
            return [];
        }), o('AssignObj', function() {
            return [$1];
        }), o('AssignList , AssignObj', function() {
            return $1.concat($3);
        }), o('AssignList OptComma TERMINATOR AssignObj', function() {
            return $1.concat($4);
        }), o('AssignList OptComma INDENT AssignList OptComma OUTDENT', function() {
            return $1.concat($4);
        })
    ],
    Class: [
        o('CLASS', function() {
            return new Class;
        }), o('CLASS Block', function() {
            return new Class(null, null, $2);
        }), o('CLASS EXTENDS Expression', function() {
            return new Class(null, $3);
        }), o('CLASS EXTENDS Expression Block', function() {
            return new Class(null, $3, $4);
        }), o('CLASS SimpleAssignable', function() {
            return new Class($2);
        }), o('CLASS SimpleAssignable Block', function() {
            return new Class($2, null, $3);
        }), o('CLASS SimpleAssignable EXTENDS Expression', function() {
            return new Class($2, $4);
        }), o('CLASS SimpleAssignable EXTENDS Expression Block', function() {
            return new Class($2, $4, $5);
        })
    ],
    Import: [
        o('IMPORT String', function() {
            return new ImportDeclaration(null, $2);
        }), o('IMPORT ImportDefaultSpecifier FROM String', function() {
            return new ImportDeclaration(new ImportClause($2, null), $4);
        }), o('IMPORT ImportNamespaceSpecifier FROM String', function() {
            return new ImportDeclaration(new ImportClause(null, $2), $4);
        }), o('IMPORT { } FROM String', function() {
            return new ImportDeclaration(new ImportClause(null, new ImportSpecifierList([])), $5);
        }), o('IMPORT { ImportSpecifierList OptComma } FROM String', function() {
            return new ImportDeclaration(new ImportClause(null, new ImportSpecifierList($3)), $7);
        }), o('IMPORT ImportDefaultSpecifier , ImportNamespaceSpecifier FROM String', function() {
            return new ImportDeclaration(new ImportClause($2, $4), $6);
        }), o('IMPORT ImportDefaultSpecifier , { ImportSpecifierList OptComma } FROM String', function() {
            return new ImportDeclaration(new ImportClause($2, new ImportSpecifierList($5)), $9);
        })
    ],
    ImportSpecifierList: [
        o('ImportSpecifier', function() {
            return [$1];
        }), o('ImportSpecifierList , ImportSpecifier', function() {
            return $1.concat($3);
        }), o('ImportSpecifierList OptComma TERMINATOR ImportSpecifier', function() {
            return $1.concat($4);
        }), o('INDENT ImportSpecifierList OptComma OUTDENT', function() {
            return $2;
        }), o('ImportSpecifierList OptComma INDENT ImportSpecifierList OptComma OUTDENT', function() {
            return $1.concat($4);
        })
    ],
    ImportSpecifier: [
        o('Identifier', function() {
            return new ImportSpecifier($1);
        }), o('Identifier AS Identifier', function() {
            return new ImportSpecifier($1, $3);
        }), o('DEFAULT', function() {
            return new ImportSpecifier(new Literal($1));
        }), o('DEFAULT AS Identifier', function() {
            return new ImportSpecifier(new Literal($1), $3);
        })
    ],
    ImportDefaultSpecifier: [
        o('Identifier', function() {
            return new ImportDefaultSpecifier($1);
        })
    ],
    ImportNamespaceSpecifier: [
        o('IMPORT_ALL AS Identifier', function() {
            return new ImportNamespaceSpecifier(new Literal($1), $3);
        })
    ],
    Export: [
        o('EXPORT { }', function() {
            return new ExportNamedDeclaration(new ExportSpecifierList([]));
        }), o('EXPORT { ExportSpecifierList OptComma }', function() {
            return new ExportNamedDeclaration(new ExportSpecifierList($3));
        }), o('EXPORT Class', function() {
            return new ExportNamedDeclaration($2);
        }), o('EXPORT Identifier = Expression', function() {
            return new ExportNamedDeclaration(new Assign($2, $4, null, {
                moduleDeclaration: 'export'
            }));
        }), o('EXPORT Identifier = TERMINATOR Expression', function() {
            return new ExportNamedDeclaration(new Assign($2, $5, null, {
                moduleDeclaration: 'export'
            }));
        }), o('EXPORT Identifier = INDENT Expression OUTDENT', function() {
            return new ExportNamedDeclaration(new Assign($2, $5, null, {
                moduleDeclaration: 'export'
            }));
        }), o('EXPORT DEFAULT Expression', function() {
            return new ExportDefaultDeclaration($3);
        }), o('EXPORT DEFAULT INDENT Object OUTDENT', function() {
            return new ExportDefaultDeclaration(new Value($4));
        }), o('EXPORT EXPORT_ALL FROM String', function() {
            return new ExportAllDeclaration(new Literal($2), $4);
        }), o('EXPORT { ExportSpecifierList OptComma } FROM String', function() {
            return new ExportNamedDeclaration(new ExportSpecifierList($3), $7);
        })
    ],
    ExportSpecifierList: [
        o('ExportSpecifier', function() {
            return [$1];
        }), o('ExportSpecifierList , ExportSpecifier', function() {
            return $1.concat($3);
        }), o('ExportSpecifierList OptComma TERMINATOR ExportSpecifier', function() {
            return $1.concat($4);
        }), o('INDENT ExportSpecifierList OptComma OUTDENT', function() {
            return $2;
        }), o('ExportSpecifierList OptComma INDENT ExportSpecifierList OptComma OUTDENT', function() {
            return $1.concat($4);
        })
    ],
    ExportSpecifier: [
        o('Identifier', function() {
            return new ExportSpecifier($1);
        }), o('Identifier AS Identifier', function() {
            return new ExportSpecifier($1, $3);
        }), o('Identifier AS DEFAULT', function() {
            return new ExportSpecifier($1, new Literal($3));
        }), o('DEFAULT', function() {
            return new ExportSpecifier(new Literal($1));
        }), o('DEFAULT AS Identifier', function() {
            return new ExportSpecifier(new Literal($1), $3);
        })
    ],
    Invocation: [
        o('Value OptFuncExist String', function() {
            return new TaggedTemplateCall($1, $3, $2);
        }), o('Value OptFuncExist Arguments', function() {
            return new Call($1, $3, $2);
        }), o('Invocation OptFuncExist Arguments', function() {
            return new Call($1, $3, $2);
        }), o('Super')
    ],
    Super: [
        o('SUPER', function() {
            return new SuperCall;
        }), o('SUPER Arguments', function() {
            return new SuperCall($2);
        })
    ],
    OptFuncExist: [
        o('', function() {
            return false;
        }), o('FUNC_EXIST', function() {
            return true;
        })
    ],
    Arguments: [
        o('CALL_START CALL_END', function() {
            return [];
        }), o('CALL_START ArgList OptComma CALL_END', function() {
            return $2;
        })
    ],
    This: [
        o('THIS', function() {
            return new Value(new ThisLiteral);
        }), o('@', function() {
            return new Value(new ThisLiteral);
        })
    ],
    ThisProperty: [
        o('@ Property', function() {
            return new Value(LOC(1)(new ThisLiteral), [LOC(2)(new Access($2))], 'this');
        })
    ],
    Array: [
        o('[ ]', function() {
            return new Arr([]);
        }), o('[ ArgList OptComma ]', function() {
            return new Arr($2);
        })
    ],
    RangeDots: [
        o('..', function() {
            return 'inclusive';
        }), o('...', function() {
            return 'exclusive';
        })
    ],
    Range: [
        o('[ Expression RangeDots Expression ]', function() {
            return new Range($2, $4, $3);
        })
    ],
    Slice: [
        o('Expression RangeDots Expression', function() {
            return new Range($1, $3, $2);
        }), o('Expression RangeDots', function() {
            return new Range($1, null, $2);
        }), o('RangeDots Expression', function() {
            return new Range(null, $2, $1);
        }), o('RangeDots', function() {
            return new Range(null, null, $1);
        })
    ],
    ArgList: [
        o('Arg', function() {
            return [$1];
        }), o('ArgList , Arg', function() {
            return $1.concat($3);
        }), o('ArgList OptComma TERMINATOR Arg', function() {
            return $1.concat($4);
        }), o('INDENT ArgList OptComma OUTDENT', function() {
            return $2;
        }), o('ArgList OptComma INDENT ArgList OptComma OUTDENT', function() {
            return $1.concat($4);
        })
    ],
    Arg: [
        o('Expression'), o('Splat'), o('...', function() {
            return new Expansion;
        })
    ],
    SimpleArgs: [
        o('Expression'), o('SimpleArgs , Expression', function() {
            return [].concat($1, $3);
        })
    ],
    Try: [
        o('TRY Block', function() {
            return new Try($2);
        }), o('TRY Block Catch', function() {
            return new Try($2, $3[0], $3[1]);
        }), o('TRY Block FINALLY Block', function() {
            return new Try($2, null, null, $4);
        }), o('TRY Block Catch FINALLY Block', function() {
            return new Try($2, $3[0], $3[1], $5);
        })
    ],
    Catch: [
        o('CATCH Identifier Block', function() {
            return [$2, $3];
        }), o('CATCH Object Block', function() {
            return [LOC(2)(new Value($2)), $3];
        }), o('CATCH Block', function() {
            return [null, $2];
        })
    ],
    Throw: [
        o('THROW Expression', function() {
            return new Throw($2);
        })
    ],
    Parenthetical: [
        o('( Body )', function() {
            return new Parens($2);
        }), o('( INDENT Body OUTDENT )', function() {
            return new Parens($3);
        })
    ],
    WhileSource: [
        o('WHILE Expression', function() {
            return new While($2);
        }), o('WHILE Expression WHEN Expression', function() {
            return new While($2, {
                guard: $4
            });
        }), o('UNTIL Expression', function() {
            return new While($2, {
                invert: true
            });
        }), o('UNTIL Expression WHEN Expression', function() {
            return new While($2, {
                invert: true,
                guard: $4
            });
        })
    ],
    While: [
        o('WhileSource Block', function() {
            return $1.addBody($2);
        }), o('Statement    WhileSource', function() {
            return $2.addBody(LOC(1)(Block.wrap([$1])));
        }), o('Expression WhileSource', function() {
            return $2.addBody(LOC(1)(Block.wrap([$1])));
        }), o('Loop', function() {
            return $1;
        })
    ],
    Loop: [
        o('LOOP Block', function() {
            return new While(LOC(1)(new BooleanLiteral('true'))).addBody($2);
        }), o('LOOP Expression', function() {
            return new While(LOC(1)(new BooleanLiteral('true'))).addBody(LOC(2)(Block.wrap([$2])));
        })
    ],
    For: [
        o('Statement ForBody', function() {
            return new For($1, $2);
        }), o('Expression ForBody', function() {
            return new For($1, $2);
        }), o('ForBody Block', function() {
            return new For($2, $1);
        })
    ],
    ForBody: [
        o('FOR Range', function() {
            return {
                source: LOC(2)(new Value($2))
            };
        }), o('FOR Range BY Expression', function() {
            return {
                source: LOC(2)(new Value($2)),
                step: $4
            };
        }), o('ForStart ForSource', function() {
            $2.own = $1.own;
            $2.ownTag = $1.ownTag;
            $2.name = $1[0];
            $2.index = $1[1];
            return $2;
        })
    ],
    ForStart: [
        o('FOR ForVariables', function() {
            return $2;
        }), o('FOR OWN ForVariables', function() {
            $3.own = true;
            $3.ownTag = LOC(2)(new Literal($2));
            return $3;
        })
    ],
    ForValue: [
        o('Identifier'), o('ThisProperty'), o('Array', function() {
            return new Value($1);
        }), o('Object', function() {
            return new Value($1);
        })
    ],
    ForVariables: [
        o('ForValue', function() {
            return [$1];
        }), o('ForValue , ForValue', function() {
            return [$1, $3];
        })
    ],
    ForSource: [
        o('FORIN Expression', function() {
            return {
                source: $2
            };
        }), o('FOROF Expression', function() {
            return {
                source: $2,
                object: true
            };
        }), o('FORIN Expression WHEN Expression', function() {
            return {
                source: $2,
                guard: $4
            };
        }), o('FOROF Expression WHEN Expression', function() {
            return {
                source: $2,
                guard: $4,
                object: true
            };
        }), o('FORIN Expression BY Expression', function() {
            return {
                source: $2,
                step: $4
            };
        }), o('FORIN Expression WHEN Expression BY Expression', function() {
            return {
                source: $2,
                guard: $4,
                step: $6
            };
        }), o('FORIN Expression BY Expression WHEN Expression', function() {
            return {
                source: $2,
                step: $4,
                guard: $6
            };
        }), o('FORFROM Expression', function() {
            return {
                source: $2,
                from: true
            };
        }), o('FORFROM Expression WHEN Expression', function() {
            return {
                source: $2,
                guard: $4,
                from: true
            };
        })
    ],
    Switch: [
        o('SWITCH Expression INDENT Whens OUTDENT', function() {
            return new Switch($2, $4);
        }), o('SWITCH Expression INDENT Whens ELSE Block OUTDENT', function() {
            return new Switch($2, $4, $6);
        }), o('SWITCH INDENT Whens OUTDENT', function() {
            return new Switch(null, $3);
        }), o('SWITCH INDENT Whens ELSE Block OUTDENT', function() {
            return new Switch(null, $3, $5);
        })
    ],
    Whens: [
        o('When'), o('Whens When', function() {
            return $1.concat($2);
        })
    ],
    When: [
        o('LEADING_WHEN SimpleArgs Block', function() {
            return [[$2, $3]];
        }), o('LEADING_WHEN SimpleArgs Block TERMINATOR', function() {
            return [[$2, $3]];
        })
    ],
    MetaIfBlock: [
        o('META_IF Expression Block', function() {
            return new MetaIf($2, $3, {
                type: $1
            });
        }), o('MetaIfBlock META_ELSE META_IF Expression Block', function() {
            return $1.addElse(LOC(3, 5)(new MetaIf($4, $5, {
                type: $3
            })));
        })
    ],
    MetaIf: [
        o('MetaIfBlock'), o('MetaIfBlock META_ELSE Block', function() {
            return $1.addElse($3);
        }), o('Statement POST_META_IF Expression', function() {
            return new MetaIf($3, LOC(1)(Block.wrap([$1])), {
                type: $2,
                statement: true
            });
        }), o('Expression POST_META_IF Expression', function() {
            return new MetaIf($3, LOC(1)(Block.wrap([$1])), {
                type: $2,
                statement: true
            });
        })
    ],
    IfBlock: [
        o('IF Expression Block', function() {
            return new If($2, $3, {
                type: $1
            });
        }), o('IfBlock ELSE IF Expression Block', function() {
            return $1.addElse(LOC(3, 5)(new If($4, $5, {
                type: $3
            })));
        })
    ],
    If: [
        o('IfBlock'), o('IfBlock ELSE Block', function() {
            return $1.addElse($3);
        }), o('Statement POST_IF Expression', function() {
            return new If($3, LOC(1)(Block.wrap([$1])), {
                type: $2,
                statement: true
            });
        }), o('Expression POST_IF Expression', function() {
            return new If($3, LOC(1)(Block.wrap([$1])), {
                type: $2,
                statement: true
            });
        })
    ],
    Operation: [
        o('UNARY Expression', function() {
            return new Op($1, $2);
        }), o('UNARY_MATH Expression', function() {
            return new Op($1, $2);
        }), o('- Expression', (function() {
            return new Op('-', $2);
        }), {
            prec: 'UNARY_MATH'
        }), o('+ Expression', (function() {
            return new Op('+', $2);
        }), {
            prec: 'UNARY_MATH'
        }), o('-- SimpleAssignable', function() {
            return new Op('--', $2);
        }), o('++ SimpleAssignable', function() {
            return new Op('++', $2);
        }), o('SimpleAssignable --', function() {
            return new Op('--', $1, null, true);
        }), o('SimpleAssignable ++', function() {
            return new Op('++', $1, null, true);
        }), o('Expression ?', function() {
            return new Existence($1);
        }), o('Expression + Expression', function() {
            return new Op('+', $1, $3);
        }), o('Expression - Expression', function() {
            return new Op('-', $1, $3);
        }), o('Expression MATH     Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression **       Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression SHIFT    Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression COMPARE  Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression &        Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression ^        Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression |        Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression &&       Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression ||       Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression BIN?     Expression', function() {
            return new Op($2, $1, $3);
        }), o('Expression RELATION Expression', function() {
            if ($2.charAt(0) === '!') {
                return new Op($2.slice(1), $1, $3).invert();
            } else {
                return new Op($2, $1, $3);
            }
        }), o('SimpleAssignable COMPOUND_ASSIGN Expression', function() {
            return new Assign($1, $3, $2);
        }), o('SimpleAssignable COMPOUND_ASSIGN INDENT Expression OUTDENT', function() {
            return new Assign($1, $4, $2);
        }), o('SimpleAssignable COMPOUND_ASSIGN TERMINATOR Expression', function() {
            return new Assign($1, $4, $2);
        }), o('SimpleAssignable EXTENDS Expression', function() {
            return new Extends($1, $3);
        })
    ]
};

operators = [['left', '.', '?.', '::', '?::'], ['left', 'CALL_START', 'CALL_END'], ['nonassoc', '++', '--'], ['left', '?'], ['right', 'UNARY'], ['right', '**'], ['right', 'UNARY_MATH'], ['left', 'MATH'], ['left', '+', '-'], ['left', 'SHIFT'], ['left', 'RELATION'], ['left', 'COMPARE'], ['left', '&'], ['left', '^'], ['left', '|'], ['left', '&&'], ['left', '||'], ['left', 'BIN?'], ['nonassoc', 'INDENT', 'OUTDENT'], ['right', 'YIELD'], ['right', '=', ':', 'COMPOUND_ASSIGN', 'RETURN', 'THROW', 'EXTENDS'], ['right', 'FORIN', 'FOROF', 'FORFROM', 'BY', 'WHEN'], ['right', 'IF', 'META_IF', 'ELSE', 'META_ELSE', 'FOR', 'WHILE', 'UNTIL', 'LOOP', 'SUPER', 'CLASS', 'IMPORT', 'EXPORT'], ['left', 'POST_IF', 'POST_META_IF']];

tokens = [];

for (name in grammar) {
    alternatives = grammar[name];
    grammar[name] = (function() {
        var i, j, len, len1, ref, results;
        results = [];
        for (i = 0, len = alternatives.length; i < len; i++) {
            alt = alternatives[i];
            ref = alt[0].split(' ');
            for (j = 0, len1 = ref.length; j < len1; j++) {
                token = ref[j];
                if (!grammar[token]) {
                    tokens.push(token);
                }
            }
            if (name === 'Root') {
                alt[1] = "return " + alt[1];
            }
            results.push(alt);
        }
        return results;
    })();
}

exports.parser = new Parser({
    bnf: grammar,
    tokens: tokens.join(' '),
    operators: operators.reverse(),
    startSymbol: 'Root'
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhbW1hci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBV0MsU0FBVSxPQUFBLENBQVEsT0FBUjs7QUFPWCxNQUFBLEdBQVM7O0FBTVQsQ0FBQSxHQUFJLFNBQUMsYUFBRCxFQUFnQixNQUFoQixFQUF3QixPQUF4QjtBQUNBLFFBQUE7SUFBQSxhQUFBLEdBQWdCLGFBQWEsQ0FBQyxPQUFkLENBQXNCLFNBQXRCLEVBQWlDLEdBQWpDO0lBQ2hCLFlBQUEsR0FBZSxhQUFhLENBQUMsS0FBZCxDQUFvQixHQUFwQixDQUF3QixDQUFDO0lBQ3hDLElBQUEsQ0FBbUQsTUFBbkQ7QUFBQSxlQUFPLENBQUMsYUFBRCxFQUFnQixVQUFoQixFQUE0QixPQUE1QixFQUFQOztJQUNBLE1BQUEsR0FBWSxDQUFBLEtBQUEsR0FBUSxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVosQ0FBUixDQUFILEdBQW1DLEtBQU0sQ0FBQSxDQUFBLENBQXpDLEdBQWlELEdBQUEsR0FBSSxNQUFKLEdBQVc7SUFHckUsTUFBQSxHQUFTLE1BQU0sQ0FBQyxPQUFQLENBQWUsU0FBZixFQUEwQixPQUExQjtJQUNULE1BQUEsR0FBUyxNQUFNLENBQUMsT0FBUCxDQUFlLDZCQUFmLEVBQThDLE9BQTlDO0lBS1QsaUJBQUEsR0FBb0IsU0FBQyxLQUFELEVBQVEsSUFBUjtRQUNoQixJQUFHLENBQUksSUFBUDttQkFDSSx3QkFBQSxHQUF5QixLQUF6QixHQUErQixJQURuQztTQUFBLE1BQUE7bUJBR0ksd0JBQUEsR0FBeUIsS0FBekIsR0FBK0IsS0FBL0IsR0FBb0MsSUFBcEMsR0FBeUMsSUFIN0M7O0lBRGdCO0lBTXBCLE1BQUEsR0FBUyxNQUFNLENBQUMsT0FBUCxDQUFlLGtCQUFmLEVBQW1DLGlCQUFBLENBQWtCLElBQWxCLENBQW5DO0lBQ1QsTUFBQSxHQUFTLE1BQU0sQ0FBQyxPQUFQLENBQWUsOEJB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QyxJQUFQLENBQVksR0FBWixDQURiO0lBRUEsU0FBQSxFQUFhLFNBQVMsQ0FBQyxPQUFWLENBQUEsQ0FGYjtJQUdBLFdBQUEsRUFBYSxNQUhiO0NBRGEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbiMgVGhlIHBhcnNlciBpcyBnZW5lcmF0ZWQgYnkgW0ppc29uXShodHRwczovL2dpdGh1Yi5jb20vemFhY2gvamlzb24pIGZyb20gdGhpcyBncmFtbWFyIGZpbGUuIFxuIyBUaGUgYGtha2UgcGFyc2VyYCBjb21tYW5kIGNvbnN0cnVjdHMgYSBwYXJzZSB0YWJsZSBmcm9tIG91ciBydWxlcyBhbmQgc2F2ZXMgaXQgaW50byBganMvcGFyc2VyLmpzYC5cblxue1BhcnNlcn0gPSByZXF1aXJlICdqaXNvbidcblxuIyBKaXNvbiBEU0xcbiMgLS0tLS0tLS0tXG4jIFNpbmNlIHdlJ3JlIGdvaW5nIHRvIGJlIHdyYXBwZWQgaW4gYSBmdW5jdGlvbiBieSBKaXNvbiBpbiBhbnkgY2FzZSwgaWYgb3VyIGFjdGlvbiBpbW1lZGlhdGVseSByZXR1cm5zIGEgdmFsdWUsIFxuIyB3ZSBjYW4gb3B0aW1pemUgYnkgcmVtb3ZpbmcgdGhlIGZ1bmN0aW9uIHdyYXBwZXIgYW5kIGp1c3QgcmV0dXJuaW5nIHRoZSB2YWx1ZSBkaXJlY3RseS5cblxudW53cmFwID0gL15mdW5jdGlvblxccypcXChcXClcXHMqXFx7XFxzKnJldHVyblxccyooW1xcc1xcU10qKTtcXHMqXFx9L1xuXG4jIE91ciBoYW5keSBEU0wgZm9yIEppc29uIGdyYW1tYXIgZ2VuZXJhdGlvbiwgdGhhbmtzIHRvIFtUaW0gQ2Fzd2VsbF0oaHR0cHM6Ly9naXRodWIuY29tL2NyZWF0aW9uaXgpLiBcbiMgRm9yIGV2ZXJ5IHJ1bGUgaW4gdGhlIGdyYW1tYXIsIHdlIHBhc3MgdGhlIHBhdHRlcm4tZGVmaW5pbmcgc3RyaW5nLCB0aGUgYWN0aW9uIHRvIHJ1biwgYW5kIGV4dHJhIG9wdGlvbnMuIFxuIyBJZiBubyBhY3Rpb24gaXMgc3BlY2lmaWVkLCB3ZSBzaW1wbHkgcGFzcyB0aGUgdmFsdWUgb2YgdGhlIHByZXZpb3VzIG5vbnRlcm1pbmFsLlxuXG5vID0gKHBhdHRlcm5TdHJpbmcsIGFjdGlvbiwgb3B0aW9ucykgLT5cbiAgICBwYXR0ZXJuU3RyaW5nID0gcGF0dGVyblN0cmluZy5yZXBsYWNlIC9cXHN7Mix9L2csICcgJ1xuICAgIHBhdHRlcm5Db3VudCA9IHBhdHRlcm5TdHJpbmcuc3BsaXQoJyAnKS5sZW5ndGhcbiAgICByZXR1cm4gW3BhdHRlcm5TdHJpbmcsICckJCA9ICQxOycgIG9wdGlvbnNdIHVubGVzcyBhY3Rpb25cbiAgICBhY3Rpb24gPSBpZiBtYXRjaCA9IHVud3JhcC5leGVjIGFjdGlvbiB0aGVuIG1hdGNoWzFdIGVsc2UgXCIoI3thY3Rpb259KCkpXCJcblxuICAgICMgQWxsIHJ1bnRpbWUgZnVuY3Rpb25zIHdlIG5lZWQgYXJlIGRlZmluZWQgb24gXCJ5eVwiXG4gICAgYWN0aW9uID0gYWN0aW9uLnJlcGxhY2UgL1xcYm5ldyAvZywgJyQmeXkuJ1xuICAgIGFjdGlvbiA9IGFjdGlvbi5yZXBsYWNlIC9cXGIoPzpCbG9ja1xcLndyYXB8ZXh0ZW5kKVxcYi9nLCAneXkuJCYnXG5cbiAgICAjIFJldHVybnMgYSBmdW5jdGlvbiB3aGljaCBhZGRzIGxvY2F0aW9uIGRhdGEgdG8gdGhlIGZpcnN0IHBhcmFtZXRlciBwYXNzZWQgaW4sIGFuZCByZXR1cm5zIHRoZSBwYXJhbWV0ZXIuICAgIFxuICAgICMgSWYgdGhlIHBhcmFtZXRlciBpcyBub3QgYSBub2RlLCBpdCB3aWxsIGp1c3QgYmUgcGFzc2VkIHRocm91Z2ggdW5hZmZlY3RlZC5cbiAgICBcbiAgICBhZGRMb2NhdGlvbkRhdGFGbiA9IChmaXJzdCwgbGFzdCkgLT5cbiAgICAgICAgaWYgbm90IGxhc3RcbiAgICAgICAgICAgIFwieXkuYWRkTG9jYXRpb25EYXRhRm4oQCN7Zmlyc3R9KVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFwieXkuYWRkTG9jYXRpb25EYXRhRm4oQCN7Zmlyc3R9LCBAI3tsYXN0fSlcIlxuXG4gICAgYWN0aW9uID0gYWN0aW9uLnJlcGxhY2UgL0xPQ1xcKChbMC05XSopXFwpL2csIGFkZExvY2F0aW9uRGF0YUZuKCckMScpXG4gICAgYWN0aW9uID0gYWN0aW9uLnJlcGxhY2UgL0xPQ1xcKChbMC05XSopLFxccyooWzAtOV0qKVxcKS9nLCBhZGRMb2NhdGlvbkRhdGFGbignJDEnICAnJDInKVxuXG4gICAgW3BhdHRlcm5TdHJpbmcsIFwiJCQgPSAje2FkZExvY2F0aW9uRGF0YUZuKDEsIHBhdHRlcm5Db3VudCl9KCN7YWN0aW9ufSk7XCIsIG9wdGlvbnNdXG5cbiMgR3JhbW1hdGljYWwgUnVsZXNcbiMgLS0tLS0tLS0tLS0tLS0tLS1cbiMgSW4gYWxsIG9mIHRoZSBydWxlcyB0aGF0IGZvbGxvdywgeW91J2xsIHNlZSB0aGUgbmFtZSBvZiB0aGUgbm9udGVybWluYWwgYXNcbiMgdGhlIGtleSB0byBhIGxpc3Qgb2YgYWx0ZXJuYXRpdmUgbWF0Y2hlcy4gV2l0aCBlYWNoIG1hdGNoJ3MgYWN0aW9uLCB0aGVcbiMgZG9sbGFyLXNpZ24gdmFyaWFibGVzIGFyZSBwcm92aWRlZCBieSBKaXNvbiBhcyByZWZlcmVuY2VzIHRvIHRoZSB2YWx1ZSBvZlxuIyB0aGVpciBudW1lcmljIHBvc2l0aW9uLCBzbyBpbiB0aGlzIHJ1bGU6XG4jXG4jICAgICAgICAgICBcIkV4cHJlc3Npb24gVU5MRVNTIEV4cHJlc3Npb25cIlxuI1xuIyBgJDFgIHdvdWxkIGJlIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgYEV4cHJlc3Npb25gLCBgJDJgIHdvdWxkIGJlIHRoZSB0b2tlblxuIyBmb3IgdGhlIGBVTkxFU1NgIHRlcm1pbmFsLCBhbmQgYCQzYCB3b3VsZCBiZSB0aGUgdmFsdWUgb2YgdGhlIHNlY29uZCBgRXhwcmVzc2lvbmAuXG4gICAgXG5ncmFtbWFyID1cblxuICAgICMgVGhlICoqUm9vdCoqIGlzIHRoZSB0b3AtbGV2ZWwgbm9kZSBpbiB0aGUgc3ludGF4IHRyZWUuIFNpbmNlIHdlIHBhcnNlIGJvdHRvbS11cCwgYWxsIHBhcnNpbmcgbXVzdCBlbmQgaGVyZS5cbiAgICBcbiAgICBSb290OiBbXG4gICAgICAgIG8gJycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEJsb2NrXG4gICAgICAgIG8gJ0JvZHknXG4gICAgXVxuXG4gICAgIyBBbnkgbGlzdCBvZiBzdGF0ZW1lbnRzIGFuZCBleHByZXNzaW9ucywgc2VwYXJhdGVkIGJ5IGxpbmUgYnJlYWtzIG9yIHNlbWljb2xvbnMuXG4gICAgXG4gICAgQm9keTogW1xuICAgICAgICBvICdMaW5lJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IEJsb2NrLndyYXAgWyQxXVxuICAgICAgICBvICdCb2R5IFRFUk1JTkFUT1IgTGluZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLnB1c2ggJDNcbiAgICAgICAgbyAnQm9keSBURVJNSU5BVE9SJ1xuICAgIF1cblxuICAgICMgQmxvY2sgYW5kIHN0YXRlbWVudHMsIHdoaWNoIG1ha2UgdXAgYSBsaW5lIGluIGEgYm9keS4gXG4gICAgIyBZaWVsZFJldHVybiBpcyBhIHN0YXRlbWVudCwgYnV0IG5vdCBpbmNsdWRlZCBpbiBTdGF0ZW1lbnQgYmVjYXVzZSB0aGF0IHJlc3VsdHMgaW4gYW4gYW1iaWd1b3VzIGdyYW1tYXIuXG4gICAgXG4gICAgTGluZTogW1xuICAgICAgICBvICdFeHByZXNzaW9uJ1xuICAgICAgICBvICdTdGF0ZW1lbnQnXG4gICAgICAgIG8gJ1lpZWxkUmV0dXJuJ1xuICAgIF1cblxuICAgICMgUHVyZSBzdGF0ZW1lbnRzIHdoaWNoIGNhbm5vdCBiZSBleHByZXNzaW9ucy5cbiAgICBcbiAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgbyAnUmV0dXJuJ1xuICAgICAgICBvICdDb21tZW50J1xuICAgICAgICBvICdTVEFURU1FTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBTdGF0ZW1lbnRMaXRlcmFsICQxXG4gICAgICAgIG8gJ0ltcG9ydCdcbiAgICAgICAgbyAnRXhwb3J0J1xuICAgIF1cblxuICAgICMgQWxsIHRoZSBkaWZmZXJlbnQgdHlwZXMgb2YgZXhwcmVzc2lvbnMgaW4gb3VyIGxhbmd1YWdlLlxuICAgICMgVGhlIGJhc2ljIHVuaXQgb2YgS29mZmVlIGlzIHRoZSAqKkV4cHJlc3Npb24qKiAtLSBldmVyeXRoaW5nIHRoYXQgY2FuIGJlIGFuIGV4cHJlc3Npb24gaXMgb25lLiBcbiAgICAjIEJsb2NrcyBzZXJ2ZSBhcyB0aGUgYnVpbGRpbmcgYmxvY2tzIG9mIG1hbnkgb3RoZXIgcnVsZXMsIG1ha2luZyB0aGVtIHNvbWV3aGF0IGNpcmN1bGFyLlxuICAgIFxuICAgIEV4cHJlc3Npb246IFtcbiAgICAgICAgbyAnVmFsdWUnXG4gICAgICAgIG8gJ0ludm9jYXRpb24nXG4gICAgICAgIG8gJ0NvZGUnXG4gICAgICAgIG8gJ09wZXJhdGlvbidcbiAgICAgICAgbyAnQXNzaWduJ1xuICAgICAgICBvICdJZidcbiAgICAgICAgbyAnTWV0YUlmJ1xuICAgICAgICBvICdUcnknXG4gICAgICAgIG8gJ1doaWxlJ1xuICAgICAgICBvICdGb3InXG4gICAgICAgIG8gJ1N3aXRjaCdcbiAgICAgICAgbyAnQ2xhc3MnXG4gICAgICAgIG8gJ1Rocm93J1xuICAgICAgICBvICdZaWVsZCdcbiAgICBdXG5cbiAgICBZaWVsZDogW1xuICAgICAgICBvICdZSUVMRCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMSwgbmV3IFZhbHVlIG5ldyBMaXRlcmFsICcnXG4gICAgICAgIG8gJ1lJRUxEIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQxLCAkMlxuICAgICAgICBvICdZSUVMRCBGUk9NIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMS5jb25jYXQoJDIpLCAkM1xuICAgIF1cblxuICAgICMgQW4gaW5kZW50ZWQgYmxvY2sgb2YgZXhwcmVzc2lvbnMuIE5vdGUgdGhhdCB0aGUgUmV3cml0ZXIgd2lsbCBjb252ZXJ0IHNvbWUgcG9zdGZpeCBmb3JtcyBpbnRvIGJsb2NrcyBmb3IgdXMsIGJ5IGFkanVzdGluZyB0aGUgdG9rZW4gc3RyZWFtLlxuICAgICAgICBcbiAgICBCbG9jazogW1xuICAgICAgICBvICdJTkRFTlQgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBCbG9ja1xuICAgICAgICBvICdJTkRFTlQgQm9keSBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQyXG4gICAgXVxuXG4gICAgSWRlbnRpZmllcjogW1xuICAgICAgICBvICdJREVOVElGSUVSJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJZGVudGlmaWVyTGl0ZXJhbCAkMVxuICAgIF1cblxuICAgIFByb3BlcnR5OiBbXG4gICAgICAgIG8gJ1BST1BFUlRZJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFByb3BlcnR5TmFtZSAkMVxuICAgIF1cblxuICAgICMgQWxwaGFudW1lcmljcyBhcmUgc2VwYXJhdGVkIGZyb20gdGhlIG90aGVyICoqTGl0ZXJhbCoqIG1hdGNoZXJzIGJlY2F1c2UgdGhleSBjYW4gYWxzbyBzZXJ2ZSBhcyBrZXlzIGluIG9iamVjdCBsaXRlcmFscy5cbiAgICBcbiAgICBBbHBoYU51bWVyaWM6IFtcbiAgICAgICAgbyAnTlVNQkVSJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgTnVtYmVyTGl0ZXJhbCAkMVxuICAgICAgICBvICdTdHJpbmcnXG4gICAgXVxuXG4gICAgU3RyaW5nOiBbXG4gICAgICAgIG8gJ1NUUklORycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFN0cmluZ0xpdGVyYWwgJDFcbiAgICAgICAgbyAnU1RSSU5HX1NUQVJUIEJvZHkgU1RSSU5HX0VORCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3RyaW5nV2l0aEludGVycG9sYXRpb25zICQyXG4gICAgXVxuXG4gICAgUmVnZXg6IFtcbiAgICAgICAgbyAnUkVHRVgnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUmVnZXhMaXRlcmFsICQxXG4gICAgICAgIG8gJ1JFR0VYX1NUQVJUIEludm9jYXRpb24gUkVHRVhfRU5EJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFJlZ2V4V2l0aEludGVycG9sYXRpb25zICQyLmFyZ3NcbiAgICBdXG5cbiAgICAjIEFsbCBvZiBvdXIgaW1tZWRpYXRlIHZhbHVlcy4gR2VuZXJhbGx5IHRoZXNlIGNhbiBiZSBwYXNzZWQgc3RyYWlnaHQgdGhyb3VnaCBhbmQgcHJpbnRlZCB0byBKYXZhU2NyaXB0LlxuICAgIFxuICAgIExpdGVyYWw6IFtcbiAgICAgICAgbyAnQWxwaGFOdW1lcmljJ1xuICAgICAgICBvICdKUycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBQYXNzdGhyb3VnaExpdGVyYWwgJDFcbiAgICAgICAgbyAnUmVnZXgnXG4gICAgICAgIG8gJ1VOREVGSU5FRCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFVuZGVmaW5lZExpdGVyYWxcbiAgICAgICAgbyAnTlVMTCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgTnVsbExpdGVyYWxcbiAgICAgICAgbyAnQk9PTCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQm9vbGVhbkxpdGVyYWwgJDFcbiAgICAgICAgbyAnSU5GSU5JVFknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW5maW5pdHlMaXRlcmFsICQxXG4gICAgICAgIG8gJ05BTicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE5hTkxpdGVyYWxcbiAgICBdXG5cbiAgICAjIEFzc2lnbm1lbnQgb2YgYSB2YXJpYWJsZSwgcHJvcGVydHksIG9yIGluZGV4IHRvIGEgdmFsdWUuXG4gICAgXG4gICAgQXNzaWduOiBbXG4gICAgICAgIG8gJ0Fzc2lnbmFibGUgPSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiAkMSwgJDNcbiAgICAgICAgbyAnQXNzaWduYWJsZSA9IFRFUk1JTkFUT1IgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQXNzaWduICQxLCAkNFxuICAgICAgICBvICdBc3NpZ25hYmxlID0gSU5ERU5UIEV4cHJlc3Npb24gT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gJDEsICQ0XG4gICAgXVxuXG4gICAgIyBBc3NpZ25tZW50IHdoZW4gaXQgaGFwcGVucyB3aXRoaW4gYW4gb2JqZWN0IGxpdGVyYWwuIFRoZSBkaWZmZXJlbmNlIGZyb20gdGhlIG9yZGluYXJ5ICoqQXNzaWduKiogaXMgdGhhdCB0aGVzZSBhbGxvdyBudW1iZXJzIGFuZCBzdHJpbmdzIGFzIGtleXMuXG4gICAgXG4gICAgQXNzaWduT2JqOiBbXG4gICAgICAgIG8gJ09iakFzc2lnbmFibGUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ09iakFzc2lnbmFibGUgOiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiBMT0MoMSkobmV3IFZhbHVlICQxKSwgJDMsICdvYmplY3QnICBvcGVyYXRvclRva2VuOiBMT0MoMikobmV3IExpdGVyYWwgJDIpXG4gICAgICAgIG8gJ09iakFzc2lnbmFibGUgOiBJTkRFTlQgRXhwcmVzc2lvbiBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiBMT0MoMSkobmV3IFZhbHVlICQxKSwgJDQsICdvYmplY3QnICBvcGVyYXRvclRva2VuOiBMT0MoMikobmV3IExpdGVyYWwgJDIpXG4gICAgICAgIG8gJ1NpbXBsZU9iakFzc2lnbmFibGUgPSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiBMT0MoMSkobmV3IFZhbHVlICQxKSwgJDMsIG51bGwsICAgICBvcGVyYXRvclRva2VuOiBMT0MoMikobmV3IExpdGVyYWwgJDIpXG4gICAgICAgIG8gJ1NpbXBsZU9iakFzc2lnbmFibGUgPSBJTkRFTlQgRXhwcmVzc2lvbiBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiBMT0MoMSkobmV3IFZhbHVlICQxKSwgJDQsIG51bGwsICAgICBvcGVyYXRvclRva2VuOiBMT0MoMikobmV3IExpdGVyYWwgJDIpXG4gICAgICAgIG8gJ0NvbW1lbnQnXG4gICAgXVxuXG4gICAgU2ltcGxlT2JqQXNzaWduYWJsZTogW1xuICAgICAgICBvICdJZGVudGlmaWVyJ1xuICAgICAgICBvICdQcm9wZXJ0eSdcbiAgICAgICAgbyAnVGhpc1Byb3BlcnR5J1xuICAgIF1cblxuICAgIE9iakFzc2lnbmFibGU6IFtcbiAgICAgICAgbyAnU2ltcGxlT2JqQXNzaWduYWJsZSdcbiAgICAgICAgbyAnQWxwaGFOdW1lcmljJ1xuICAgIF1cblxuICAgICMgQSByZXR1cm4gc3RhdGVtZW50IGZyb20gYSBmdW5jdGlvbiBib2R5LlxuICAgIFxuICAgIFJldHVybjogW1xuICAgICAgICBvICdSRVRVUk4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBSZXR1cm4gJDJcbiAgICAgICAgbyAnUkVUVVJOIElOREVOVCBPYmplY3QgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUmV0dXJuIG5ldyBWYWx1ZSAkM1xuICAgICAgICBvICdSRVRVUk4nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBSZXR1cm5cbiAgICBdXG5cbiAgICBZaWVsZFJldHVybjogW1xuICAgICAgICBvICdZSUVMRCBSRVRVUk4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBZaWVsZFJldHVybiAkM1xuICAgICAgICBvICdZSUVMRCBSRVRVUk4nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBZaWVsZFJldHVyblxuICAgIF1cblxuICAgICMgQSBibG9jayBjb21tZW50LlxuICAgIFxuICAgIENvbW1lbnQ6IFtcbiAgICAgICAgbyAnSEVSRUNPTU1FTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQ29tbWVudCAkMVxuICAgIF1cblxuICAgICMgVGhlIENvZGUgbm9kZSBpcyB0aGUgZnVuY3Rpb24gbGl0ZXJhbC4gSXQncyBkZWZpbmVkIGJ5IGFuIGluZGVudGVkIGJsb2NrXG4gICAgIyBvZiBCbG9jayBwcmVjZWRlZCBieSBhIGZ1bmN0aW9uIGFycm93LCB3aXRoIGFuIG9wdGlvbmFsIHBhcmFtZXRlciBsaXN0LlxuICAgIFxuICAgIENvZGU6IFtcbiAgICAgICAgbyAnUEFSQU1fU1RBUlQgUGFyYW1MaXN0IFBBUkFNX0VORCBGdW5jR2x5cGggQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQ29kZSAkMiwgJDUsICQ0XG4gICAgICAgIG8gJ0Z1bmNHbHlwaCBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENvZGUgW10sICQyLCAkMVxuICAgIF1cblxuICAgICMgS29mZmVlIGhhcyB0d28gZGlmZmVyZW50IHN5bWJvbHMgZm9yIGZ1bmN0aW9ucy4gYC0+YCBpcyBmb3Igb3JkaW5hcnkgZnVuY3Rpb25zLCBhbmQgYD0+YCBpcyBmb3IgZnVuY3Rpb25zIGJvdW5kIHRvIHRoZSBjdXJyZW50IHZhbHVlIG9mICp0aGlzKi5cbiAgICAgICAgXG4gICAgRnVuY0dseXBoOiBbXG4gICAgICAgIG8gJy0+JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJ2Z1bmMnXG4gICAgICAgIG8gJz0+JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJ2JvdW5kZnVuYydcbiAgICBdXG5cbiAgICBPcHRDb21tYTogW1xuICAgICAgICBvICcnXG4gICAgICAgIG8gJywnXG4gICAgXVxuXG4gICAgIyBUaGUgbGlzdCBvZiBwYXJhbWV0ZXJzIHRoYXQgYSBmdW5jdGlvbiBhY2NlcHRzIGNhbiBiZSBvZiBhbnkgbGVuZ3RoLlxuICAgIFxuICAgIFBhcmFtTGlzdDogW1xuICAgICAgICBvICcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFtdXG4gICAgICAgIG8gJ1BhcmFtJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gWyQxXVxuICAgICAgICBvICdQYXJhbUxpc3QgLCBQYXJhbScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkM1xuICAgICAgICBvICdQYXJhbUxpc3QgT3B0Q29tbWEgVEVSTUlOQVRPUiBQYXJhbScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgICAgICBvICdQYXJhbUxpc3QgT3B0Q29tbWEgSU5ERU5UIFBhcmFtTGlzdCBPcHRDb21tYSBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgIF1cblxuICAgICMgQSBzaW5nbGUgcGFyYW1ldGVyIGluIGEgZnVuY3Rpb24gZGVmaW5pdGlvbiBjYW4gYmUgb3JkaW5hcnksIG9yIGEgc3BsYXQgdGhhdCBob292ZXJzIHVwIHRoZSByZW1haW5pbmcgYXJndW1lbnRzLlxuICAgIFxuICAgIFBhcmFtOiBbXG4gICAgICAgIG8gJ1BhcmFtVmFyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFBhcmFtICQxXG4gICAgICAgIG8gJ1BhcmFtVmFyIC4uLicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFBhcmFtICQxLCBudWxsLCBvblxuICAgICAgICBvICdQYXJhbVZhciA9IEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBQYXJhbSAkMSwgJDNcbiAgICAgICAgbyAnLi4uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwYW5zaW9uXG4gICAgXVxuXG4gICAgIyBGdW5jdGlvbiBQYXJhbWV0ZXJzXG4gICAgXG4gICAgUGFyYW1WYXI6IFtcbiAgICAgICAgbyAnSWRlbnRpZmllcidcbiAgICAgICAgbyAnVGhpc1Byb3BlcnR5J1xuICAgICAgICBvICdBcnJheSdcbiAgICAgICAgbyAnT2JqZWN0J1xuICAgIF1cblxuICAgICMgQSBzcGxhdCB0aGF0IG9jY3VycyBvdXRzaWRlIG9mIGEgcGFyYW1ldGVyIGxpc3QuXG4gICAgXG4gICAgU3BsYXQ6IFtcbiAgICAgICAgbyAnRXhwcmVzc2lvbiAuLi4nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3BsYXQgJDFcbiAgICBdXG5cbiAgICAjIFZhcmlhYmxlcyBhbmQgcHJvcGVydGllcyB0aGF0IGNhbiBiZSBhc3NpZ25lZCB0by5cbiAgICBcbiAgICBTaW1wbGVBc3NpZ25hYmxlOiBbXG4gICAgICAgIG8gJ0lkZW50aWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ1ZhbHVlIEFjY2Vzc29yJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuYWRkICQyXG4gICAgICAgIG8gJ0ludm9jYXRpb24gQWNjZXNzb3InICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxLCBbXS5jb25jYXQgJDJcbiAgICAgICAgbyAnVGhpc1Byb3BlcnR5J1xuICAgIF1cblxuICAgICMgRXZlcnl0aGluZyB0aGF0IGNhbiBiZSBhc3NpZ25lZCB0by5cbiAgICBcbiAgICBBc3NpZ25hYmxlOiBbXG4gICAgICAgIG8gJ1NpbXBsZUFzc2lnbmFibGUnXG4gICAgICAgIG8gJ0FycmF5JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ09iamVjdCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgXVxuXG4gICAgIyBUaGUgdHlwZXMgb2YgdGhpbmdzIHRoYXQgY2FuIGJlIHRyZWF0ZWQgYXMgdmFsdWVzIC0tIGFzc2lnbmVkIHRvLCBpbnZva2VkIGFzIGZ1bmN0aW9ucywgaW5kZXhlZCBpbnRvLCBuYW1lZCBhcyBhIGNsYXNzLCBldGMuXG4gICAgXG4gICAgVmFsdWU6IFtcbiAgICAgICAgbyAnQXNzaWduYWJsZSdcbiAgICAgICAgbyAnTGl0ZXJhbCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVmFsdWUgJDFcbiAgICAgICAgbyAnUGFyZW50aGV0aWNhbCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVmFsdWUgJDFcbiAgICAgICAgbyAnUmFuZ2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVmFsdWUgJDFcbiAgICAgICAgbyAnVGhpcydcbiAgICBdXG5cbiAgICAjIFRoZSBnZW5lcmFsIGdyb3VwIG9mIGFjY2Vzc29ycyBpbnRvIGFuIG9iamVjdCwgYnkgcHJvcGVydHksIGJ5IHByb3RvdHlwZSBvciBieSBhcnJheSBpbmRleCBvciBzbGljZS5cbiAgICBcbiAgICBBY2Nlc3NvcjogW1xuICAgICAgICBvICcuICAgUHJvcGVydHknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBY2Nlc3MgJDJcbiAgICAgICAgbyAnPy4gIFByb3BlcnR5JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQWNjZXNzICQyLCAnc29haydcbiAgICAgICAgbyAnOjogIFByb3BlcnR5JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbTE9DKDEpKG5ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSgncHJvdG90eXBlJykpLCBMT0MoMikobmV3IEFjY2VzcyAkMildXG4gICAgICAgIG8gJz86OiBQcm9wZXJ0eScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gW0xPQygxKShuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUoJ3Byb3RvdHlwZScpLCAnc29haycpLCBMT0MoMikobmV3IEFjY2VzcyAkMildXG4gICAgICAgIG8gJzo6JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lICdwcm90b3R5cGUnXG4gICAgICAgIG8gJ0luZGV4J1xuICAgIF1cblxuICAgICMgSW5kZXhpbmcgaW50byBhbiBvYmplY3Qgb3IgYXJyYXkgdXNpbmcgYnJhY2tldCBub3RhdGlvbi5cbiAgICBcbiAgICBJbmRleDogW1xuICAgICAgICBvICdJTkRFWF9TVEFSVCBJbmRleFZhbHVlIElOREVYX0VORCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQyXG4gICAgICAgIG8gJ0lOREVYX1NPQUsgICAgSW5kZXgnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gZXh0ZW5kICQyLCBzb2FrIDogeWVzXG4gICAgXVxuXG4gICAgSW5kZXhWYWx1ZTogW1xuICAgICAgICBvICdFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJbmRleCAkMVxuICAgICAgICBvICdTbGljZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBTbGljZSAkMVxuICAgIF1cblxuICAgICMgSW4gS29mZmVlLCBhbiBvYmplY3QgbGl0ZXJhbCBpcyBzaW1wbHkgYSBsaXN0IG9mIGFzc2lnbm1lbnRzLlxuICAgIFxuICAgIE9iamVjdDogW1xuICAgICAgICBvICd7IEFzc2lnbkxpc3QgT3B0Q29tbWEgfScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPYmogJDIsICQxLmdlbmVyYXRlZFxuICAgIF1cblxuICAgICMgQXNzaWdubWVudCBvZiBwcm9wZXJ0aWVzIHdpdGhpbiBhbiBvYmplY3QgbGl0ZXJhbCBjYW4gYmUgc2VwYXJhdGVkIGJ5IGNvbW1hLCBhcyBpbiBKYXZhU2NyaXB0LCBvciBzaW1wbHkgYnkgbmV3bGluZS5cbiAgICBcbiAgICBBc3NpZ25MaXN0OiBbXG4gICAgICAgIG8gJycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gW11cbiAgICAgICAgbyAnQXNzaWduT2JqJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbJDFdXG4gICAgICAgIG8gJ0Fzc2lnbkxpc3QgLCBBc3NpZ25PYmonICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQzXG4gICAgICAgIG8gJ0Fzc2lnbkxpc3QgT3B0Q29tbWEgVEVSTUlOQVRPUiBBc3NpZ25PYmonICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQ0XG4gICAgICAgIG8gJ0Fzc2lnbkxpc3QgT3B0Q29tbWEgSU5ERU5UIEFzc2lnbkxpc3QgT3B0Q29tbWEgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQ0XG4gICAgXVxuXG4gICAgIyBDbGFzcyBkZWZpbml0aW9ucyBoYXZlIG9wdGlvbmFsIGJvZGllcyBvZiBwcm90b3R5cGUgcHJvcGVydHkgYXNzaWdubWVudHMsIGFuZCBvcHRpb25hbCByZWZlcmVuY2VzIHRvIHRoZSBzdXBlcmNsYXNzLlxuICAgIFxuICAgIENsYXNzOiBbXG4gICAgICAgIG8gJ0NMQVNTJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENsYXNzXG4gICAgICAgIG8gJ0NMQVNTIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENsYXNzIG51bGwsIG51bGwsICQyXG4gICAgICAgIG8gJ0NMQVNTIEVYVEVORFMgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENsYXNzIG51bGwsICQzXG4gICAgICAgIG8gJ0NMQVNTIEVYVEVORFMgRXhwcmVzc2lvbiBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENsYXNzIG51bGwsICQzLCAkNFxuICAgICAgICBvICdDTEFTUyBTaW1wbGVBc3NpZ25hYmxlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDbGFzcyAkMlxuICAgICAgICBvICdDTEFTUyBTaW1wbGVBc3NpZ25hYmxlIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDbGFzcyAkMiwgbnVsbCwgJDNcbiAgICAgICAgbyAnQ0xBU1MgU2ltcGxlQXNzaWduYWJsZSBFWFRFTkRTIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQ2xhc3MgJDIsICQ0XG4gICAgICAgIG8gJ0NMQVNTIFNpbXBsZUFzc2lnbmFibGUgRVhURU5EUyBFeHByZXNzaW9uIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENsYXNzICQyLCAkNCwgJDVcbiAgICBdXG5cbiAgICBJbXBvcnQ6IFtcbiAgICAgICAgbyAnSU1QT1JUIFN0cmluZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW1wb3J0RGVjbGFyYXRpb24gbnVsbCwgJDJcbiAgICAgICAgbyAnSU1QT1JUIEltcG9ydERlZmF1bHRTcGVjaWZpZXIgRlJPTSBTdHJpbmcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW1wb3J0RGVjbGFyYXRpb24gbmV3IEltcG9ydENsYXVzZSgkMiwgbnVsbCksICQ0XG4gICAgICAgIG8gJ0lNUE9SVCBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgRlJPTSBTdHJpbmcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydERlY2xhcmF0aW9uIG5ldyBJbXBvcnRDbGF1c2UobnVsbCwgJDIpLCAkNFxuICAgICAgICBvICdJTVBPUlQgeyB9IEZST00gU3RyaW5nJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJbXBvcnREZWNsYXJhdGlvbiBuZXcgSW1wb3J0Q2xhdXNlKG51bGwsIG5ldyBJbXBvcnRTcGVjaWZpZXJMaXN0IFtdKSwgJDVcbiAgICAgICAgbyAnSU1QT1JUIHsgSW1wb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSB9IEZST00gU3RyaW5nJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW1wb3J0RGVjbGFyYXRpb24gbmV3IEltcG9ydENsYXVzZShudWxsLCBuZXcgSW1wb3J0U3BlY2lmaWVyTGlzdCAkMyksICQ3XG4gICAgICAgIG8gJ0lNUE9SVCBJbXBvcnREZWZhdWx0U3BlY2lmaWVyICwgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyIEZST00gU3RyaW5nJyAgICAgICAgICAgLT4gbmV3IEltcG9ydERlY2xhcmF0aW9uIG5ldyBJbXBvcnRDbGF1c2UoJDIsICQ0KSwgJDZcbiAgICAgICAgbyAnSU1QT1JUIEltcG9ydERlZmF1bHRTcGVjaWZpZXIgLCB7IEltcG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgfSBGUk9NIFN0cmluZycgICAtPiBuZXcgSW1wb3J0RGVjbGFyYXRpb24gbmV3IEltcG9ydENsYXVzZSgkMiwgbmV3IEltcG9ydFNwZWNpZmllckxpc3QgJDUpLCAkOVxuICAgIF1cblxuICAgIEltcG9ydFNwZWNpZmllckxpc3Q6IFtcbiAgICAgICAgbyAnSW1wb3J0U3BlY2lmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbJDFdXG4gICAgICAgIG8gJ0ltcG9ydFNwZWNpZmllckxpc3QgLCBJbXBvcnRTcGVjaWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQzXG4gICAgICAgIG8gJ0ltcG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgVEVSTUlOQVRPUiBJbXBvcnRTcGVjaWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQ0XG4gICAgICAgIG8gJ0lOREVOVCBJbXBvcnRTcGVjaWZpZXJMaXN0IE9wdENvbW1hIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDJcbiAgICAgICAgbyAnSW1wb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSBJTkRFTlQgSW1wb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSBPVVRERU5UJyAgICAgICAtPiAkMS5jb25jYXQgJDRcbiAgICBdXG5cbiAgICBJbXBvcnRTcGVjaWZpZXI6IFtcbiAgICAgICAgbyAnSWRlbnRpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW1wb3J0U3BlY2lmaWVyICQxXG4gICAgICAgIG8gJ0lkZW50aWZpZXIgQVMgSWRlbnRpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydFNwZWNpZmllciAkMSwgJDNcbiAgICAgICAgbyAnREVGQVVMVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW1wb3J0U3BlY2lmaWVyIG5ldyBMaXRlcmFsICQxXG4gICAgICAgIG8gJ0RFRkFVTFQgQVMgSWRlbnRpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydFNwZWNpZmllciBuZXcgTGl0ZXJhbCgkMSksICQzXG4gICAgXVxuXG4gICAgSW1wb3J0RGVmYXVsdFNwZWNpZmllcjogW1xuICAgICAgICBvICdJZGVudGlmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJbXBvcnREZWZhdWx0U3BlY2lmaWVyICQxXG4gICAgXVxuXG4gICAgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyOiBbXG4gICAgICAgIG8gJ0lNUE9SVF9BTEwgQVMgSWRlbnRpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydE5hbWVzcGFjZVNwZWNpZmllciBuZXcgTGl0ZXJhbCgkMSksICQzXG4gICAgXVxuXG4gICAgRXhwb3J0OiBbXG4gICAgICAgIG8gJ0VYUE9SVCB7IH0nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydE5hbWVkRGVjbGFyYXRpb24gbmV3IEV4cG9ydFNwZWNpZmllckxpc3QgW11cbiAgICAgICAgbyAnRVhQT1JUIHsgRXhwb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSB9JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0TmFtZWREZWNsYXJhdGlvbiBuZXcgRXhwb3J0U3BlY2lmaWVyTGlzdCAkM1xuICAgICAgICBvICdFWFBPUlQgQ2xhc3MnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnROYW1lZERlY2xhcmF0aW9uICQyXG4gICAgICAgIG8gJ0VYUE9SVCBJZGVudGlmaWVyID0gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydE5hbWVkRGVjbGFyYXRpb24gbmV3IEFzc2lnbiAkMiwgJDQsIG51bGwsIG1vZHVsZURlY2xhcmF0aW9uOiAnZXhwb3J0J1xuICAgICAgICBvICdFWFBPUlQgSWRlbnRpZmllciA9IFRFUk1JTkFUT1IgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnROYW1lZERlY2xhcmF0aW9uIG5ldyBBc3NpZ24gJDIsICQ1LCBudWxsLCBtb2R1bGVEZWNsYXJhdGlvbjogJ2V4cG9ydCdcbiAgICAgICAgbyAnRVhQT1JUIElkZW50aWZpZXIgPSBJTkRFTlQgRXhwcmVzc2lvbiBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0TmFtZWREZWNsYXJhdGlvbiBuZXcgQXNzaWduICQyLCAkNSwgbnVsbCwgbW9kdWxlRGVjbGFyYXRpb246ICdleHBvcnQnXG4gICAgICAgIG8gJ0VYUE9SVCBERUZBVUxUIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbiAkM1xuICAgICAgICBvICdFWFBPUlQgREVGQVVMVCBJTkRFTlQgT2JqZWN0IE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24gbmV3IFZhbHVlICQ0XG4gICAgICAgIG8gJ0VYUE9SVCBFWFBPUlRfQUxMIEZST00gU3RyaW5nJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydEFsbERlY2xhcmF0aW9uIG5ldyBMaXRlcmFsKCQyKSwgJDRcbiAgICAgICAgbyAnRVhQT1JUIHsgRXhwb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSB9IEZST00gU3RyaW5nJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0TmFtZWREZWNsYXJhdGlvbiBuZXcgRXhwb3J0U3BlY2lmaWVyTGlzdCgkMyksICQ3XG4gICAgXVxuXG4gICAgRXhwb3J0U3BlY2lmaWVyTGlzdDogW1xuICAgICAgICBvICdFeHBvcnRTcGVjaWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFskMV1cbiAgICAgICAgbyAnRXhwb3J0U3BlY2lmaWVyTGlzdCAsIEV4cG9ydFNwZWNpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDNcbiAgICAgICAgbyAnRXhwb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSBURVJNSU5BVE9SIEV4cG9ydFNwZWNpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDRcbiAgICAgICAgbyAnSU5ERU5UIEV4cG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgICAgICBvICdFeHBvcnRTcGVjaWZpZXJMaXN0IE9wdENvbW1hIElOREVOVCBFeHBvcnRTcGVjaWZpZXJMaXN0IE9wdENvbW1hIE9VVERFTlQnICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgIF1cblxuICAgIEV4cG9ydFNwZWNpZmllcjogW1xuICAgICAgICBvICdJZGVudGlmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnRTcGVjaWZpZXIgJDFcbiAgICAgICAgbyAnSWRlbnRpZmllciBBUyBJZGVudGlmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0U3BlY2lmaWVyICQxLCAkM1xuICAgICAgICBvICdJZGVudGlmaWVyIEFTIERFRkFVTFQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnRTcGVjaWZpZXIgJDEsIG5ldyBMaXRlcmFsICQzXG4gICAgICAgIG8gJ0RFRkFVTFQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydFNwZWNpZmllciBuZXcgTGl0ZXJhbCAkMVxuICAgICAgICBvICdERUZBVUxUIEFTIElkZW50aWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnRTcGVjaWZpZXIgbmV3IExpdGVyYWwoJDEpLCAkM1xuICAgIF1cblxuICAgICMgT3JkaW5hcnkgZnVuY3Rpb24gaW52b2NhdGlvbiwgb3IgYSBjaGFpbmVkIHNlcmllcyBvZiBjYWxscy5cbiAgICBcbiAgICBJbnZvY2F0aW9uOiBbXG4gICAgICAgIG8gJ1ZhbHVlIE9wdEZ1bmNFeGlzdCBTdHJpbmcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFRhZ2dlZFRlbXBsYXRlQ2FsbCAkMSwgJDMsICQyXG4gICAgICAgIG8gJ1ZhbHVlIE9wdEZ1bmNFeGlzdCBBcmd1bWVudHMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENhbGwgJDEsICQzLCAkMlxuICAgICAgICBvICdJbnZvY2F0aW9uIE9wdEZ1bmNFeGlzdCBBcmd1bWVudHMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDYWxsICQxLCAkMywgJDJcbiAgICAgICAgbyAnU3VwZXInXG4gICAgXVxuXG4gICAgU3VwZXI6IFtcbiAgICAgICAgbyAnU1VQRVInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3VwZXJDYWxsXG4gICAgICAgIG8gJ1NVUEVSIEFyZ3VtZW50cycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFN1cGVyQ2FsbCAkMlxuICAgIF1cblxuICAgICMgQW4gb3B0aW9uYWwgZXhpc3RlbmNlIGNoZWNrIG9uIGEgZnVuY3Rpb24uXG4gICAgXG4gICAgT3B0RnVuY0V4aXN0OiBbXG4gICAgICAgIG8gJycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbm9cbiAgICAgICAgbyAnRlVOQ19FWElTVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiB5ZXNcbiAgICBdXG5cbiAgICAjIFRoZSBsaXN0IG9mIGFyZ3VtZW50cyB0byBhIGZ1bmN0aW9uIGNhbGwuXG4gICAgXG4gICAgQXJndW1lbnRzOiBbXG4gICAgICAgIG8gJ0NBTExfU1RBUlQgQ0FMTF9FTkQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gW11cbiAgICAgICAgbyAnQ0FMTF9TVEFSVCBBcmdMaXN0IE9wdENvbW1hIENBTExfRU5EJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgIF1cblxuICAgIFRoaXM6IFtcbiAgICAgICAgbyAnVEhJUycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVmFsdWUgbmV3IFRoaXNMaXRlcmFsXG4gICAgICAgIG8gJ0AnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlIG5ldyBUaGlzTGl0ZXJhbFxuICAgIF1cblxuICAgIFRoaXNQcm9wZXJ0eTogW1xuICAgICAgICBvICdAIFByb3BlcnR5JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBWYWx1ZSBMT0MoMSkobmV3IFRoaXNMaXRlcmFsKSwgW0xPQygyKShuZXcgQWNjZXNzKCQyKSldLCAndGhpcydcbiAgICBdXG5cbiAgICBBcnJheTogW1xuICAgICAgICBvICdbIF0nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBcnIgW11cbiAgICAgICAgbyAnWyBBcmdMaXN0IE9wdENvbW1hIF0nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQXJyICQyXG4gICAgXVxuXG4gICAgUmFuZ2VEb3RzOiBbXG4gICAgICAgIG8gJy4uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJ2luY2x1c2l2ZSdcbiAgICAgICAgbyAnLi4uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAnZXhjbHVzaXZlJ1xuICAgIF1cblxuICAgIFJhbmdlOiBbXG4gICAgICAgIG8gJ1sgRXhwcmVzc2lvbiBSYW5nZURvdHMgRXhwcmVzc2lvbiBdJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFJhbmdlICQyLCAkNCwgJDNcbiAgICBdXG5cbiAgICAjIEFycmF5IHNsaWNlIGxpdGVyYWxzLlxuICAgIFxuICAgIFNsaWNlOiBbXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gUmFuZ2VEb3RzIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFJhbmdlICQxLCAkMywgJDJcbiAgICAgICAgbyAnRXhwcmVzc2lvbiBSYW5nZURvdHMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUmFuZ2UgJDEsIG51bGwsICQyXG4gICAgICAgIG8gJ1JhbmdlRG90cyBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFJhbmdlIG51bGwsICQyLCAkMVxuICAgICAgICBvICdSYW5nZURvdHMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBSYW5nZSBudWxsLCBudWxsLCAkMVxuICAgIF1cblxuICAgICMgVGhlICoqQXJnTGlzdCoqIGlzIGJvdGggdGhlIGxpc3Qgb2Ygb2JqZWN0cyBwYXNzZWQgaW50byBhIGZ1bmN0aW9uIGNhbGwsIGFzIHdlbGwgYXMgdGhlIGNvbnRlbnRzIG9mIGFuIGFycmF5IGxpdGVyYWwgKGkuZS4gY29tbWEtc2VwYXJhdGVkIGV4cHJlc3Npb25zKS4gXG4gICAgIyBOZXdsaW5lcyB3b3JrIGFzIHdlbGwuXG4gICAgXG4gICAgQXJnTGlzdDogW1xuICAgICAgICBvICdBcmcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFskMV1cbiAgICAgICAgbyAnQXJnTGlzdCAsIEFyZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDNcbiAgICAgICAgbyAnQXJnTGlzdCBPcHRDb21tYSBURVJNSU5BVE9SIEFyZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDRcbiAgICAgICAgbyAnSU5ERU5UIEFyZ0xpc3QgT3B0Q29tbWEgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgICAgICBvICdBcmdMaXN0IE9wdENvbW1hIElOREVOVCBBcmdMaXN0IE9wdENvbW1hIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgIF1cblxuICAgICMgVmFsaWQgYXJndW1lbnRzIGFyZSBCbG9ja3Mgb3IgU3BsYXRzLlxuICAgIFxuICAgIEFyZzogW1xuICAgICAgICBvICdFeHByZXNzaW9uJ1xuICAgICAgICBvICdTcGxhdCdcbiAgICAgICAgbyAnLi4uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwYW5zaW9uXG4gICAgXVxuXG4gICAgIyBKdXN0IHNpbXBsZSwgY29tbWEtc2VwYXJhdGVkLCByZXF1aXJlZCBhcmd1bWVudHMgKG5vIGZhbmN5IHN5bnRheCkuIFxuICAgICMgV2UgbmVlZCB0aGlzIHRvIGJlIHNlcGFyYXRlIGZyb20gdGhlICoqQXJnTGlzdCoqIGZvciB1c2UgaW4gKipTd2l0Y2gqKiBibG9ja3MsIHdoZXJlIGhhdmluZyB0aGUgbmV3bGluZXMgd291bGRuJ3QgbWFrZSBzZW5zZS5cbiAgICBcbiAgICBTaW1wbGVBcmdzOiBbXG4gICAgICAgIG8gJ0V4cHJlc3Npb24nXG4gICAgICAgIG8gJ1NpbXBsZUFyZ3MgLCBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gW10uY29uY2F0ICQxLCAkM1xuICAgIF1cblxuICAgICMgVGhlIHZhcmlhbnRzIG9mICp0cnkvY2F0Y2gvZmluYWxseSogZXhjZXB0aW9uIGhhbmRsaW5nIGJsb2Nrcy5cbiAgICBcbiAgICBUcnk6IFtcbiAgICAgICAgbyAnVFJZIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVHJ5ICQyXG4gICAgICAgIG8gJ1RSWSBCbG9jayBDYXRjaCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFRyeSAkMiwgJDNbMF0sICQzWzFdXG4gICAgICAgIG8gJ1RSWSBCbG9jayBGSU5BTExZIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFRyeSAkMiwgbnVsbCwgbnVsbCwgJDRcbiAgICAgICAgbyAnVFJZIEJsb2NrIENhdGNoIEZJTkFMTFkgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVHJ5ICQyLCAkM1swXSwgJDNbMV0sICQ1XG4gICAgXVxuXG4gICAgIyBBIGNhdGNoIGNsYXVzZSBuYW1lcyBpdHMgZXJyb3IgYW5kIHJ1bnMgYSBibG9jayBvZiBjb2RlLlxuICAgIFxuICAgIENhdGNoOiBbXG4gICAgICAgIG8gJ0NBVENIIElkZW50aWZpZXIgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gWyQyLCAkM11cbiAgICAgICAgbyAnQ0FUQ0ggT2JqZWN0IEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbTE9DKDIpKG5ldyBWYWx1ZSgkMikpLCAkM11cbiAgICAgICAgbyAnQ0FUQ0ggQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbbnVsbCwgJDJdXG4gICAgXVxuXG4gICAgVGhyb3c6IFtcbiAgICAgICAgbyAnVEhST1cgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVGhyb3cgJDJcbiAgICBdXG5cbiAgICAjIFBhcmVudGhldGljYWwgZXhwcmVzc2lvbnMuIFxuICAgICMgTm90ZSB0aGF0IHRoZSAqKlBhcmVudGhldGljYWwqKiBpcyBhICoqVmFsdWUqKiwgbm90IGFuICoqRXhwcmVzc2lvbioqLCBzbyBpZiB5b3UgbmVlZCB0byB1c2UgYW4gZXhwcmVzc2lvbiBpbiBhIHBsYWNlXG4gICAgIyB3aGVyZSBvbmx5IHZhbHVlcyBhcmUgYWNjZXB0ZWQsIHdyYXBwaW5nIGl0IGluIHBhcmVudGhlc2VzIHdpbGwgYWx3YXlzIGRvIHRoZSB0cmljay5cbiAgICBcbiAgICBQYXJlbnRoZXRpY2FsOiBbXG4gICAgICAgIG8gJyggQm9keSApJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFBhcmVucyAkMlxuICAgICAgICBvICcoIElOREVOVCBCb2R5IE9VVERFTlQgKScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBQYXJlbnMgJDNcbiAgICBdXG5cbiAgICAjIFRoZSBjb25kaXRpb24gcG9ydGlvbiBvZiBhIHdoaWxlIGxvb3AuXG4gICAgICAgIFxuICAgIFdoaWxlU291cmNlOiBbXG4gICAgICAgIG8gJ1dISUxFIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFdoaWxlICQyXG4gICAgICAgIG8gJ1dISUxFIEV4cHJlc3Npb24gV0hFTiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFdoaWxlICQyLCBndWFyZDogJDRcbiAgICAgICAgbyAnVU5USUwgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgV2hpbGUgJDIsIGludmVydDogdHJ1ZVxuICAgICAgICBvICdVTlRJTCBFeHByZXNzaW9uIFdIRU4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBXaGlsZSAkMiwgaW52ZXJ0OiB0cnVlLCBndWFyZDogJDRcbiAgICBdXG5cbiAgICAjIFRoZSB3aGlsZSBsb29wIGNhbiBlaXRoZXIgYmUgbm9ybWFsLCB3aXRoIGEgYmxvY2sgb2YgZXhwcmVzc2lvbnMgdG8gZXhlY3V0ZSwgb3IgcG9zdGZpeCwgd2l0aCBhIHNpbmdsZSBleHByZXNzaW9uLiBcbiAgICAjIFRoZXJlIGlzIG5vIGRvLi53aGlsZS5cbiAgICBcbiAgICBXaGlsZTogW1xuICAgICAgICBvICdXaGlsZVNvdXJjZSBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmFkZEJvZHkgJDJcbiAgICAgICAgbyAnU3RhdGVtZW50ICAgIFdoaWxlU291cmNlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMi5hZGRCb2R5IExPQygxKSBCbG9jay53cmFwKFskMV0pXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gV2hpbGVTb3VyY2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDIuYWRkQm9keSBMT0MoMSkgQmxvY2sud3JhcChbJDFdKVxuICAgICAgICBvICdMb29wJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxXG4gICAgXVxuXG4gICAgTG9vcDogW1xuICAgICAgICBvICdMT09QIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBXaGlsZShMT0MoMSkgbmV3IEJvb2xlYW5MaXRlcmFsICd0cnVlJykuYWRkQm9keSAkMlxuICAgICAgICBvICdMT09QIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBXaGlsZShMT0MoMSkgbmV3IEJvb2xlYW5MaXRlcmFsICd0cnVlJykuYWRkQm9keSBMT0MoMikgQmxvY2sud3JhcCBbJDJdXG4gICAgXVxuXG4gICAgIyBBcnJheSwgb2JqZWN0LCBhbmQgcmFuZ2UgY29tcHJlaGVuc2lvbnMsIGF0IHRoZSBtb3N0IGdlbmVyaWMgbGV2ZWwuXG4gICAgIyBDb21wcmVoZW5zaW9ucyBjYW4gZWl0aGVyIGJlIG5vcm1hbCwgd2l0aCBhIGJsb2NrIG9mIGV4cHJlc3Npb25zIHRvIGV4ZWN1dGUsIG9yIHBvc3RmaXgsIHdpdGggYSBzaW5nbGUgZXhwcmVzc2lvbi5cbiAgICBcbiAgICBGb3I6IFtcbiAgICAgICAgbyAnU3RhdGVtZW50IEZvckJvZHknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRm9yICQxLCAkMlxuICAgICAgICBvICdFeHByZXNzaW9uIEZvckJvZHknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBGb3IgJDEsICQyXG4gICAgICAgIG8gJ0ZvckJvZHkgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEZvciAkMiwgJDFcbiAgICBdXG5cbiAgICBGb3JCb2R5OiBbXG4gICAgICAgIG8gJ0ZPUiBSYW5nZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAoTE9DKDIpIG5ldyBWYWx1ZSgkMikpXG4gICAgICAgIG8gJ0ZPUiBSYW5nZSBCWSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAoTE9DKDIpIG5ldyBWYWx1ZSgkMikpLCBzdGVwOiAkNFxuICAgICAgICBvICdGb3JTdGFydCBGb3JTb3VyY2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQyLm93biA9ICQxLm93bjsgJDIub3duVGFnID0gJDEub3duVGFnOyAkMi5uYW1lID0gJDFbMF07ICQyLmluZGV4ID0gJDFbMV07ICQyXG4gICAgXVxuXG4gICAgRm9yU3RhcnQ6IFtcbiAgICAgICAgbyAnRk9SIEZvclZhcmlhYmxlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgICAgICBvICdGT1IgT1dOIEZvclZhcmlhYmxlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQzLm93biA9IHllczsgJDMub3duVGFnID0gKExPQygyKSBuZXcgTGl0ZXJhbCgkMikpOyAkM1xuICAgIF1cblxuICAgICMgQW4gYXJyYXkgb2YgYWxsIGFjY2VwdGVkIHZhbHVlcyBmb3IgYSB2YXJpYWJsZSBpbnNpZGUgdGhlIGxvb3AuIFRoaXMgZW5hYmxlcyBzdXBwb3J0IGZvciBwYXR0ZXJuIG1hdGNoaW5nLlxuICAgICAgICBcbiAgICBGb3JWYWx1ZTogW1xuICAgICAgICBvICdJZGVudGlmaWVyJ1xuICAgICAgICBvICdUaGlzUHJvcGVydHknXG4gICAgICAgIG8gJ0FycmF5JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ09iamVjdCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgXVxuXG4gICAgIyBBbiBhcnJheSBvciByYW5nZSBjb21wcmVoZW5zaW9uIGhhcyB2YXJpYWJsZXMgZm9yIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIChvcHRpb25hbCkgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluZGV4LiBcbiAgICAjIE9yLCAqa2V5LCB2YWx1ZSosIGluIHRoZSBjYXNlIG9mIG9iamVjdCBjb21wcmVoZW5zaW9ucy5cbiAgICBcbiAgICBGb3JWYXJpYWJsZXM6IFtcbiAgICAgICAgbyAnRm9yVmFsdWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbJDFdXG4gICAgICAgIG8gJ0ZvclZhbHVlICwgRm9yVmFsdWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gWyQxLCAkM11cbiAgICBdXG5cbiAgICAjIFRoZSBzb3VyY2Ugb2YgYSBjb21wcmVoZW5zaW9uIGlzIGFuIGFycmF5IG9yIG9iamVjdCB3aXRoIGFuIG9wdGlvbmFsIGd1YXJkIGNsYXVzZS5cbiAgICAjIElmIGl0J3MgYW4gYXJyYXkgY29tcHJlaGVuc2lvbiwgeW91IGNhbiBhbHNvIGNob29zZSB0byBzdGVwIHRocm91Z2ggaW4gZml4ZWQtc2l6ZSBpbmNyZW1lbnRzLlxuICAgIFxuICAgIEZvclNvdXJjZTogW1xuICAgICAgICBvICdGT1JJTiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IHNvdXJjZTogJDJcbiAgICAgICAgbyAnRk9ST0YgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBvYmplY3Q6IHllc1xuICAgICAgICBvICdGT1JJTiBFeHByZXNzaW9uIFdIRU4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IHNvdXJjZTogJDIsIGd1YXJkOiAkNFxuICAgICAgICBvICdGT1JPRiBFeHByZXNzaW9uIFdIRU4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IHNvdXJjZTogJDIsIGd1YXJkOiAkNCwgb2JqZWN0OiB5ZXNcbiAgICAgICAgbyAnRk9SSU4gRXhwcmVzc2lvbiBCWSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBzdGVwOiAgJDRcbiAgICAgICAgbyAnRk9SSU4gRXhwcmVzc2lvbiBXSEVOIEV4cHJlc3Npb24gQlkgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBndWFyZDogJDQsIHN0ZXA6ICQ2XG4gICAgICAgIG8gJ0ZPUklOIEV4cHJlc3Npb24gQlkgRXhwcmVzc2lvbiBXSEVOIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAkMiwgc3RlcDogICQ0LCBndWFyZDogJDZcbiAgICAgICAgbyAnRk9SRlJPTSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBmcm9tOiAgeWVzXG4gICAgICAgIG8gJ0ZPUkZST00gRXhwcmVzc2lvbiBXSEVOIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAkMiwgZ3VhcmQ6ICQ0LCBmcm9tOiB5ZXNcbiAgICBdXG5cbiAgICBTd2l0Y2g6IFtcbiAgICAgICAgbyAnU1dJVENIIEV4cHJlc3Npb24gSU5ERU5UIFdoZW5zIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3dpdGNoICQyLCAkNFxuICAgICAgICBvICdTV0lUQ0ggRXhwcmVzc2lvbiBJTkRFTlQgV2hlbnMgRUxTRSBCbG9jayBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBTd2l0Y2ggJDIsICQ0LCAkNlxuICAgICAgICBvICdTV0lUQ0ggSU5ERU5UIFdoZW5zIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBTd2l0Y2ggbnVsbCwgJDNcbiAgICAgICAgbyAnU1dJVENIIElOREVOVCBXaGVucyBFTFNFIEJsb2NrIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3dpdGNoIG51bGwsICQzLCAkNVxuICAgIF1cblxuICAgIFdoZW5zOiBbXG4gICAgICAgIG8gJ1doZW4nXG4gICAgICAgIG8gJ1doZW5zIFdoZW4nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQyXG4gICAgXVxuXG4gICAgIyBBbiBpbmRpdmlkdWFsICoqV2hlbioqIGNsYXVzZSwgd2l0aCBhY3Rpb24uXG4gICAgXG4gICAgV2hlbjogW1xuICAgICAgICBvICdMRUFESU5HX1dIRU4gU2ltcGxlQXJncyBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFtbJDIsICQzXV1cbiAgICAgICAgbyAnTEVBRElOR19XSEVOIFNpbXBsZUFyZ3MgQmxvY2sgVEVSTUlOQVRPUicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbWyQyLCAkM11dXG4gICAgXVxuXG4gICAgIyBUaGUgbW9zdCBiYXNpYyBmb3JtIG9mICppZiogaXMgYSBjb25kaXRpb24gYW5kIGFuIGFjdGlvbi4gXG4gICAgIyBUaGUgZm9sbG93aW5nIGlmLXJlbGF0ZWQgcnVsZXMgYXJlIGJyb2tlbiB1cCBhbG9uZyB0aGVzZSBsaW5lcyBpbiBvcmRlciB0byBhdm9pZCBhbWJpZ3VpdHkuXG5cbiAgICBNZXRhSWZCbG9jazogW1xuICAgICAgICBvICdNRVRBX0lGIEV4cHJlc3Npb24gQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBNZXRhSWYgJDIsICQzLCB0eXBlOiAkMVxuICAgICAgICBvICdNZXRhSWZCbG9jayBNRVRBX0VMU0UgTUVUQV9JRiBFeHByZXNzaW9uIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmFkZEVsc2UgTE9DKDMsNSkgbmV3IE1ldGFJZiAkNCwgJDUsIHR5cGU6ICQzXG4gICAgXVxuXG4gICAgTWV0YUlmOiBbXG4gICAgICAgIG8gJ01ldGFJZkJsb2NrJ1xuICAgICAgICBvICdNZXRhSWZCbG9jayBNRVRBX0VMU0UgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmFkZEVsc2UgJDNcbiAgICAgICAgbyAnU3RhdGVtZW50IFBPU1RfTUVUQV9JRiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgTWV0YUlmICQzLCBMT0MoMSkoQmxvY2sud3JhcCBbJDFdKSwgdHlwZTogJDIsIHN0YXRlbWVudDogdHJ1ZVxuICAgICAgICBvICdFeHByZXNzaW9uIFBPU1RfTUVUQV9JRiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBNZXRhSWYgJDMsIExPQygxKShCbG9jay53cmFwIFskMV0pLCB0eXBlOiAkMiwgc3RhdGVtZW50OiB0cnVlXG4gICAgXVxuICAgIFxuICAgIElmQmxvY2s6IFtcbiAgICAgICAgbyAnSUYgRXhwcmVzc2lvbiBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSWYgJDIsICQzLCB0eXBlOiAkMVxuICAgICAgICBvICdJZkJsb2NrIEVMU0UgSUYgRXhwcmVzc2lvbiBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmFkZEVsc2UgTE9DKDMsNSkgbmV3IElmICQ0LCAkNSwgdHlwZTogJDNcbiAgICBdXG5cbiAgICAjIFRoZSBmdWxsIGNvbXBsZW1lbnQgb2YgKmlmKiBleHByZXNzaW9ucywgaW5jbHVkaW5nIHBvc3RmaXggb25lLWxpbmVyICppZiogYW5kICp1bmxlc3MqLlxuICAgIFxuICAgIElmOiBbXG4gICAgICAgIG8gJ0lmQmxvY2snXG4gICAgICAgIG8gJ0lmQmxvY2sgRUxTRSBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuYWRkRWxzZSAkM1xuICAgICAgICBvICdTdGF0ZW1lbnQgUE9TVF9JRiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJZiAkMywgTE9DKDEpKEJsb2NrLndyYXAgWyQxXSksIHR5cGU6ICQyLCBzdGF0ZW1lbnQ6IHRydWVcbiAgICAgICAgbyAnRXhwcmVzc2lvbiBQT1NUX0lGIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSWYgJDMsIExPQygxKShCbG9jay53cmFwIFskMV0pLCB0eXBlOiAkMiwgc3RhdGVtZW50OiB0cnVlXG4gICAgXVxuXG4gICAgIyBBcml0aG1ldGljIGFuZCBsb2dpY2FsIG9wZXJhdG9ycywgd29ya2luZyBvbiBvbmUgb3IgbW9yZSBvcGVyYW5kcy5cbiAgICAjIEhlcmUgdGhleSBhcmUgZ3JvdXBlZCBieSBvcmRlciBvZiBwcmVjZWRlbmNlLiBUaGUgYWN0dWFsIHByZWNlZGVuY2UgcnVsZXMgYXJlIGRlZmluZWQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgcGFnZS4gXG4gICAgIyBJdCB3b3VsZCBiZSBzaG9ydGVyIGlmIHdlIGNvdWxkIGNvbWJpbmUgbW9zdCBvZiB0aGVzZSBydWxlcyBpbnRvIGEgc2luZ2xlIGdlbmVyaWMgKk9wZXJhbmQgT3BTeW1ib2wgT3BlcmFuZCotdHlwZSBydWxlLCBcbiAgICAjIGJ1dCBpbiBvcmRlciB0byBtYWtlIHRoZSBwcmVjZWRlbmNlIGJpbmRpbmcgcG9zc2libGUsIHNlcGFyYXRlIHJ1bGVzIGFyZSBuZWNlc3NhcnkuXG4gICAgXG4gICAgT3BlcmF0aW9uOiBbXG4gICAgICAgIG8gJ1VOQVJZIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQxICwgJDJcbiAgICAgICAgbyAnVU5BUllfTUFUSCBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDEgLCAkMlxuICAgICAgICBvICctIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKC0+IG5ldyBPcCAnLScgICQyKSwgcHJlYzogJ1VOQVJZX01BVEgnXG4gICAgICAgIG8gJysgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoLT4gbmV3IE9wICcrJyAgJDIpLCBwcmVjOiAnVU5BUllfTUFUSCdcblxuICAgICAgICBvICctLSBTaW1wbGVBc3NpZ25hYmxlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAnLS0nICQyXG4gICAgICAgIG8gJysrIFNpbXBsZUFzc2lnbmFibGUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICcrKycgJDJcbiAgICAgICAgbyAnU2ltcGxlQXNzaWduYWJsZSAtLScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJy0tJyAkMSwgbnVsbCwgdHJ1ZVxuICAgICAgICBvICdTaW1wbGVBc3NpZ25hYmxlICsrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAnKysnICQxLCBudWxsLCB0cnVlXG5cbiAgICAgICAgbyAnRXhwcmVzc2lvbiA/JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhpc3RlbmNlICQxXG5cbiAgICAgICAgbyAnRXhwcmVzc2lvbiArIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJysnICwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gLSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICctJyAsICQxLCAkM1xuXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gTUFUSCAgICAgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQyLCAkMSwgJDNcbiAgICAgICAgbyAnRXhwcmVzc2lvbiAqKiAgICAgICBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDIsICQxLCAkM1xuICAgICAgICBvICdFeHByZXNzaW9uIFNISUZUICAgIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMiwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gQ09NUEFSRSAgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQyLCAkMSwgJDNcbiAgICAgICAgbyAnRXhwcmVzc2lvbiAmICAgICAgICBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDIsICQxLCAkM1xuICAgICAgICBvICdFeHByZXNzaW9uIF4gICAgICAgIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMiwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gfCAgICAgICAgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQyLCAkMSwgJDNcbiAgICAgICAgbyAnRXhwcmVzc2lvbiAmJiAgICAgICBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDIsICQxLCAkM1xuICAgICAgICBvICdFeHByZXNzaW9uIHx8ICAgICAgIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMiwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gQklOPyAgICAgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQyLCAkMSwgJDNcbiAgICAgICAgbyAnRXhwcmVzc2lvbiBSRUxBVElPTiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBpZiAkMi5jaGFyQXQoMCkgaXMgJyEnIHRoZW4gbmV3IE9wKCQyWzEuLl0sICQxLCAkMykuaW52ZXJ0KCkgZWxzZSBuZXcgT3AgJDIsICQxLCAkM1xuXG4gICAgICAgIG8gJ1NpbXBsZUFzc2lnbmFibGUgQ09NUE9VTkRfQVNTSUdOIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiAkMSwgJDMsICQyXG4gICAgICAgIG8gJ1NpbXBsZUFzc2lnbmFibGUgQ09NUE9VTkRfQVNTSUdOIElOREVOVCBFeHByZXNzaW9uIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiAkMSwgJDQsICQyXG4gICAgICAgIG8gJ1NpbXBsZUFzc2lnbmFibGUgQ09NUE9VTkRfQVNTSUdOIFRFUk1JTkFUT1IgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiAkMSwgJDQsICQyXG4gICAgICAgIG8gJ1NpbXBsZUFzc2lnbmFibGUgRVhURU5EUyBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4dGVuZHMgJDEsICQzXG4gICAgXVxuXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbiMgT3BlcmF0b3JzIGF0IHRoZSB0b3Agb2YgdGhpcyBsaXN0IGhhdmUgaGlnaGVyIHByZWNlZGVuY2UgdGhhbiB0aGUgb25lcyBsb3dlciBkb3duLlxuIyBGb2xsb3dpbmcgdGhlc2UgcnVsZXMgaXMgd2hhdCBtYWtlcyBgMiArIDMgKiA0YCBwYXJzZSBhczogYDIgKyAoMyAqIDQpYCBhbmQgbm90IGAoMiArIDMpICogNGBcblxub3BlcmF0b3JzID0gW1xuICAgIFsnbGVmdCcgICAgICcuJyAnPy4nICc6OicgJz86OiddXG4gICAgWydsZWZ0JyAgICAgJ0NBTExfU1RBUlQnICdDQUxMX0VORCddXG4gICAgWydub25hc3NvYycgJysrJyAnLS0nXVxuICAgIFsnbGVmdCcgICAgICc/J11cbiAgICBbJ3JpZ2h0JyAgICAnVU5BUlknXVxuICAgIFsncmlnaHQnICAgICcqKiddXG4gICAgWydyaWdodCcgICAgJ1VOQVJZX01BVEgnXVxuICAgIFsnbGVmdCcgICAgICdNQVRIJ11cbiAgICBbJ2xlZnQnICAgICAnKycgJy0nXVxuICAgIFsnbGVmdCcgICAgICdTSElGVCddXG4gICAgWydsZWZ0JyAgICAgJ1JFTEFUSU9OJ11cbiAgICBbJ2xlZnQnICAgICAnQ09NUEFSRSddXG4gICAgWydsZWZ0JyAgICAgJyYnXVxuICAgIFsnbGVmdCcgICAgICdeJ11cbiAgICBbJ2xlZnQnICAgICAnfCddXG4gICAgWydsZWZ0JyAgICAgJyYmJ11cbiAgICBbJ2xlZnQnICAgICAnfHwnXVxuICAgIFsnbGVmdCcgICAgICdCSU4/J11cbiAgICBbJ25vbmFzc29jJyAnSU5ERU5UJyAnT1VUREVOVCddXG4gICAgWydyaWdodCcgICAgJ1lJRUxEJ11cbiAgICBbJ3JpZ2h0JyAgICAnPScgJzonICdDT01QT1VORF9BU1NJR04nICdSRVRVUk4nICdUSFJPVycgJ0VYVEVORFMnXVxuICAgIFsncmlnaHQnICAgICdGT1JJTicgJ0ZPUk9GJyAnRk9SRlJPTScgJ0JZJyAnV0hFTiddXG4gICAgWydyaWdodCcgICAgJ0lGJyAnTUVUQV9JRicgJ0VMU0UnICdNRVRBX0VMU0UnICdGT1InICdXSElMRScgJ1VOVElMJyAnTE9PUCcgJ1NVUEVSJyAnQ0xBU1MnICdJTVBPUlQnICdFWFBPUlQnXVxuICAgIFsnbGVmdCcgICAgICdQT1NUX0lGJyAnUE9TVF9NRVRBX0lGJ11cbl1cblxuIyBXcmFwcGluZyBVcFxuIyAtLS0tLS0tLS0tLVxuIyBGaW5hbGx5LCBub3cgdGhhdCB3ZSBoYXZlIG91ciBncmFtbWFyIGFuZCBvdXIgb3BlcmF0b3JzLCB3ZSBjYW4gY3JlYXRlIG91ciBKaXNvbi5QYXJzZXIuIFxuIyBXZSBkbyB0aGlzIGJ5IHByb2Nlc3NpbmcgYWxsIG9mIG91ciBydWxlcywgcmVjb3JkaW5nIGFsbCB0ZXJtaW5hbHMgKGV2ZXJ5IHN5bWJvbCB3aGljaCBkb2VzIG5vdCBhcHBlYXIgYXMgdGhlIG5hbWUgb2YgYSBydWxlIGFib3ZlKSBhcyBcInRva2Vuc1wiLlxuXG50b2tlbnMgPSBbXVxuZm9yIG5hbWUsIGFsdGVybmF0aXZlcyBvZiBncmFtbWFyXG4gICAgZ3JhbW1hcltuYW1lXSA9IGZvciBhbHQgaW4gYWx0ZXJuYXRpdmVzXG4gICAgICAgIGZvciB0b2tlbiBpbiBhbHRbMF0uc3BsaXQgJyAnXG4gICAgICAgICAgICB0b2tlbnMucHVzaCB0b2tlbiB1bmxlc3MgZ3JhbW1hclt0b2tlbl1cbiAgICAgICAgYWx0WzFdID0gXCJyZXR1cm4gI3thbHRbMV19XCIgaWYgbmFtZSBpcyAnUm9vdCdcbiAgICAgICAgYWx0XG5cbiMgSW5pdGlhbGl6ZSB0aGUgUGFyc2VyIHdpdGggb3VyIGxpc3Qgb2YgdGVybWluYWwgdG9rZW5zLCBvdXIgZ3JhbW1hciBydWxlcywgYW5kIHRoZSBuYW1lIG9mIHRoZSByb290LiBcbiMgUmV2ZXJzZSB0aGUgb3BlcmF0b3JzIGJlY2F1c2UgSmlzb24gb3JkZXJzIHByZWNlZGVuY2UgZnJvbSBsb3cgdG8gaGlnaCwgYW5kIHdlIGhhdmUgaXQgaGlnaCB0byBsb3cgKGFzIGluIFtZYWNjXShodHRwOi8vZGlub3NhdXIuY29tcGlsZXJ0b29scy5uZXQveWFjYy9pbmRleC5odG1sKSkuXG5cbmV4cG9ydHMucGFyc2VyID0gbmV3IFBhcnNlclxuICAgIGJuZjogICAgICAgICBncmFtbWFyXG4gICAgdG9rZW5zOiAgICAgIHRva2Vucy5qb2luICcgJ1xuICAgIG9wZXJhdG9yczogICBvcGVyYXRvcnMucmV2ZXJzZSgpXG4gICAgc3RhcnRTeW1ib2w6ICdSb290J1xuIl19
//# sourceURL=../coffee/grammar.coffee