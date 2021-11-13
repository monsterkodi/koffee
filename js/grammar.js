// koffee 1.19.0

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
    ForSlice: [
        o('Expression RangeDots Expression', function() {
            return new Range($1, $3, $2);
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
        }), o('FORIN ForSlice', function() {
            return {
                source: $2
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhbW1hci5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbImdyYW1tYXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVdFLFNBQVcsT0FBQSxDQUFRLE9BQVI7O0FBT2IsTUFBQSxHQUFTOztBQU1ULENBQUEsR0FBSSxTQUFDLGFBQUQsRUFBZ0IsTUFBaEIsRUFBd0IsT0FBeEI7QUFDQSxRQUFBO0lBQUEsYUFBQSxHQUFnQixhQUFhLENBQUMsT0FBZCxDQUFzQixTQUF0QixFQUFpQyxHQUFqQztJQUNoQixZQUFBLEdBQWUsYUFBYSxDQUFDLEtBQWQsQ0FBb0IsR0FBcEIsQ0FBd0IsQ0FBQztJQUN4QyxJQUFBLENBQW1ELE1BQW5EO0FBQUEsZUFBTyxDQUFDLGFBQUQsRUFBZ0IsVUFBaEIsRUFBNEIsT0FBNUIsRUFBUDs7SUFDQSxNQUFBLEdBQVksQ0FBQSxLQUFBLEdBQVEsTUFBTSxDQUFDLElBQVAsQ0FBWSxNQUFaLENBQVIsQ0FBSCxHQUFtQyxLQUFNLENBQUEsQ0FBQSxDQUF6QyxHQUFpRCxHQUFBLEdBQUksTUFBSixHQUFXO0lBR3JFLE1BQUEsR0FBUyxNQUFNLENBQUMsT0FBUCxDQUFlLFNBQWYsRUFBMEIsT0FBMUI7SUFDVCxNQUFBLEdBQVMsTUFBTSxDQUFDLE9BQVAsQ0FBZSw2QkFBZixFQUE4QyxPQUE5QztJQUtULGlCQUFBLEdBQW9CLFNBQUMsS0FBRCxFQUFRLElBQVI7UUFDaEIsSUFBRyxDQUFJLElBQVA7bUJBQ0ksd0JBQUEsR0FBeUIsS0FBekIsR0FBK0IsSUFEbkM7U0FBQSxNQUFBO21CQUdJLHdCQUFBLEdBQXlCLEtBQXpCLEdBQStCLEtBQS9CLEdBQW9DLElBQXBDLEdBQXlDLElBSDdDOztJQURnQjtJQU1wQixNQUFBLEdBQVMsTUFBTSxDQUFDLE9BQVAsQ0FBZSxrQkFBZixFQUFtQyxpQkFBQSxDQUFrQixJQUFsQixDQUFuQztJQUNULE1BQUEsR0FBUyxNQUFNLENBQUMsT0FBUCxDQUFlLDhCQUFmLEVBQStDLGlCQUFBLENBQWtCLElBQWxCLEVBQXdCLElBQXhCLENBQS9DO1dBRVQsQ0FBQyxhQUFELEVBQWdCLE9BQUEsR0FBTyxDQUFDLGlCQUFBLENBQWtCLENBQWxCLEVBQXFCLFlBQXJCLENBQUQsQ0FBUCxHQUEyQyxHQUEzQyxHQUE4QyxNQUE5QyxHQUFxRCxJQUFyRSxFQUEwRSxPQUExRTtBQXRCQTs7QUFvQ0osT0FBQSxHQUlJO0lBQUEsSUFBQSxFQUFNO1FBQ0YsQ0FBQSxDQUFFLEVBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJO1FBQVAsQ0FBbkYsQ0FERSxFQUVGLENBQUEsQ0FBRSxNQUFGLENBRkU7S0FBTjtJQU9BLElBQUEsRUFBTTtRQUNGLENBQUEsQ0FBRSxNQUFGLEVBQW1GLFNBQUE7bUJBQUcsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLEVBQUQsQ0FBWDtRQUFILENBQW5GLENBREUsRUFFRixDQUFBLENBQUUsc0JBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsSUFBSCxDQUFRLEVBQVI7UUFBSCxDQUFuRixDQUZFLEVBR0YsQ0FBQSxDQUFFLGlCQUFGLENBSEU7S0FQTjtJQWdCQSxJQUFBLEVBQU0sQ0FDRixDQUFBLENBQUUsWUFBRixDQURFLEVBRUYsQ0FBQSxDQUFFLFdBQUYsQ0FGRSxFQUdGLENBQUEsQ0FBRSxhQUFGLENBSEUsQ0FoQk47SUF3QkEsU0FBQSxFQUFXO1FBQ1AsQ0FBQSxDQUFFLFFBQUYsQ0FETyxFQUVQLENBQUEsQ0FBRSxTQUFGLENBRk8sRUFHUCxDQUFBLENBQUUsV0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksZ0JBQUosQ0FBcUIsRUFBckI7UUFBSCxDQUFuRixDQUhPLEVBSVAsQ0FBQSxDQUFFLFFBQUYsQ0FKTyxFQUtQLENBQUEsQ0FBRSxRQUFGLENBTE87S0F4Qlg7SUFvQ0EsVUFBQSxFQUFZLENBQ1IsQ0FBQSxDQUFFLE9BQUYsQ0FEUSxFQUVSLENBQUEsQ0FBRSxZQUFGLENBRlEsRUFHUixDQUFBLENBQUUsTUFBRixDQUhRLEVBSVIsQ0FBQSxDQUFFLFdBQUYsQ0FKUSxFQUtSLENBQUEsQ0FBRSxRQUFGLENBTFEsRUFNUixDQUFBLENBQUUsSUFBRixDQU5RLEVBT1IsQ0FBQSxDQUFFLFFBQUYsQ0FQUSxFQVFSLENBQUEsQ0FBRSxLQUFGLENBUlEsRUFTUixDQUFBLENBQUUsT0FBRixDQVRRLEVBVVIsQ0FBQSxDQUFFLEtBQUYsQ0FWUSxFQVdSLENBQUEsQ0FBRSxRQUFGLENBWFEsRUFZUixDQUFBLENBQUUsT0FBRixDQVpRLEVBYVIsQ0FBQSxDQUFFLE9BQUYsQ0FiUSxFQWNSLENBQUEsQ0FBRSxPQUFGLENBZFEsQ0FwQ1o7SUFxREEsS0FBQSxFQUFPO1FBQ0gsQ0FBQSxDQUFFLE9BQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEVBQUosQ0FBTyxFQUFQLEVBQVcsSUFBSSxLQUFKLENBQVUsSUFBSSxPQUFKLENBQVksRUFBWixDQUFWLENBQVg7UUFBSCxDQUFuRixDQURHLEVBRUgsQ0FBQSxDQUFFLGtCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVg7UUFBSCxDQUFuRixDQUZHLEVBR0gsQ0FBQSxDQUFFLHVCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBRSxDQUFDLE1BQUgsQ0FBVSxFQUFWLENBQVAsRUFBc0IsRUFBdEI7UUFBSCxDQUFuRixDQUhHO0tBckRQO0lBNkRBLEtBQUEsRUFBTztRQUNILENBQUEsQ0FBRSxnQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUk7UUFBUCxDQUFuRixDQURHLEVBRUgsQ0FBQSxDQUFFLHFCQUFGLEVBQW1GLFNBQUE7bUJBQUc7UUFBSCxDQUFuRixDQUZHO0tBN0RQO0lBa0VBLFVBQUEsRUFBWTtRQUNSLENBQUEsQ0FBRSxZQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxpQkFBSixDQUFzQixFQUF0QjtRQUFILENBQW5GLENBRFE7S0FsRVo7SUFzRUEsUUFBQSxFQUFVO1FBQ04sQ0FBQSxDQUFFLFVBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLFlBQUosQ0FBaUIsRUFBakI7UUFBSCxDQUFuRixDQURNO0tBdEVWO0lBNEVBLFlBQUEsRUFBYztRQUNWLENBQUEsQ0FBRSxRQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxhQUFKLENBQWtCLEVBQWxCO1FBQUgsQ0FBbkYsQ0FEVSxFQUVWLENBQUEsQ0FBRSxRQUFGLENBRlU7S0E1RWQ7SUFpRkEsTUFBQSxFQUFRO1FBQ0osQ0FBQSxDQUFFLFFBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGFBQUosQ0FBa0IsRUFBbEI7UUFBSCxDQUFuRixDQURJLEVBRUosQ0FBQSxDQUFFLDhCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSx3QkFBSixDQUE2QixFQUE3QjtRQUFILENBQW5GLENBRkk7S0FqRlI7SUFzRkEsS0FBQSxFQUFPO1FBQ0gsQ0FBQSxDQUFFLE9BQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLFlBQUosQ0FBaUIsRUFBakI7UUFBSCxDQUFuRixDQURHLEVBRUgsQ0FBQSxDQUFFLGtDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSx1QkFBSixDQUE0QixFQUFFLENBQUMsSUFBL0I7UUFBSCxDQUFuRixDQUZHO0tBdEZQO0lBNkZBLE9BQUEsRUFBUztRQUNMLENBQUEsQ0FBRSxjQUFGLENBREssRUFFTCxDQUFBLENBQUUsSUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksa0JBQUosQ0FBdUIsRUFBdkI7UUFBSCxDQUFuRixDQUZLLEVBR0wsQ0FBQSxDQUFFLE9BQUYsQ0FISyxFQUlMLENBQUEsQ0FBRSxXQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSTtRQUFQLENBQW5GLENBSkssRUFLTCxDQUFBLENBQUUsTUFBRixFQUFtRixTQUFBO21CQUFHLElBQUk7UUFBUCxDQUFuRixDQUxLLEVBTUwsQ0FBQSxDQUFFLE1BQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGNBQUosQ0FBbUIsRUFBbkI7UUFBSCxDQUFuRixDQU5LLEVBT0wsQ0FBQSxDQUFFLFVBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGVBQUosQ0FBb0IsRUFBcEI7UUFBSCxDQUFuRixDQVBLLEVBUUwsQ0FBQSxDQUFFLEtBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJO1FBQVAsQ0FBbkYsQ0FSSztLQTdGVDtJQTBHQSxNQUFBLEVBQVE7UUFDSixDQUFBLENBQUUseUJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxFQUFYLEVBQWUsRUFBZjtRQUFILENBQW5GLENBREksRUFFSixDQUFBLENBQUUsb0NBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxFQUFYLEVBQWUsRUFBZjtRQUFILENBQW5GLENBRkksRUFHSixDQUFBLENBQUUsd0NBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxFQUFYLEVBQWUsRUFBZjtRQUFILENBQW5GLENBSEk7S0ExR1I7SUFrSEEsU0FBQSxFQUFXO1FBQ1AsQ0FBQSxDQUFFLGVBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FETyxFQUVQLENBQUEsQ0FBRSw0QkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLEtBQUosQ0FBVSxFQUFWLENBQVAsQ0FBWCxFQUFpQyxFQUFqQyxFQUFxQyxRQUFyQyxFQUErQztnQkFBQSxhQUFBLEVBQWUsR0FBQSxDQUFJLENBQUosQ0FBQSxDQUFPLElBQUksT0FBSixDQUFZLEVBQVosQ0FBUCxDQUFmO2FBQS9DO1FBQUgsQ0FBbkYsQ0FGTyxFQUdQLENBQUEsQ0FBRSwyQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLEtBQUosQ0FBVSxFQUFWLENBQVAsQ0FBWCxFQUFpQyxFQUFqQyxFQUFxQyxRQUFyQyxFQUErQztnQkFBQSxhQUFBLEVBQWUsR0FBQSxDQUFJLENBQUosQ0FBQSxDQUFPLElBQUksT0FBSixDQUFZLEVBQVosQ0FBUCxDQUFmO2FBQS9DO1FBQUgsQ0FBbkYsQ0FITyxFQUlQLENBQUEsQ0FBRSxrQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLEtBQUosQ0FBVSxFQUFWLENBQVAsQ0FBWCxFQUFpQyxFQUFqQyxFQUFxQyxJQUFyQyxFQUErQztnQkFBQSxhQUFBLEVBQWUsR0FBQSxDQUFJLENBQUosQ0FBQSxDQUFPLElBQUksT0FBSixDQUFZLEVBQVosQ0FBUCxDQUFmO2FBQS9DO1FBQUgsQ0FBbkYsQ0FKTyxFQUtQLENBQUEsQ0FBRSxpREFBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLEtBQUosQ0FBVSxFQUFWLENBQVAsQ0FBWCxFQUFpQyxFQUFqQyxFQUFxQyxJQUFyQyxFQUErQztnQkFBQSxhQUFBLEVBQWUsR0FBQSxDQUFJLENBQUosQ0FBQSxDQUFPLElBQUksT0FBSixDQUFZLEVBQVosQ0FBUCxDQUFmO2FBQS9DO1FBQUgsQ0FBbkYsQ0FMTyxFQU1QLENBQUEsQ0FBRSxTQUFGLENBTk87S0FsSFg7SUEySEEsbUJBQUEsRUFBcUIsQ0FDakIsQ0FBQSxDQUFFLFlBQUYsQ0FEaUIsRUFFakIsQ0FBQSxDQUFFLFVBQUYsQ0FGaUIsRUFHakIsQ0FBQSxDQUFFLGNBQUYsQ0FIaUIsQ0EzSHJCO0lBaUlBLGFBQUEsRUFBZSxDQUNYLENBQUEsQ0FBRSxxQkFBRixDQURXLEVBRVgsQ0FBQSxDQUFFLGNBQUYsQ0FGVyxDQWpJZjtJQXdJQSxNQUFBLEVBQVE7UUFDSixDQUFBLENBQUUsbUJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxFQUFYO1FBQUgsQ0FBbkYsQ0FESSxFQUVKLENBQUEsQ0FBRSw4QkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLElBQUksS0FBSixDQUFVLEVBQVYsQ0FBWDtRQUFILENBQW5GLENBRkksRUFHSixDQUFBLENBQUUsUUFBRixFQUFtRixTQUFBO21CQUFHLElBQUk7UUFBUCxDQUFuRixDQUhJO0tBeElSO0lBOElBLFdBQUEsRUFBYTtRQUNULENBQUEsQ0FBRSx5QkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksV0FBSixDQUFnQixFQUFoQjtRQUFILENBQW5GLENBRFMsRUFFVCxDQUFBLENBQUUsY0FBRixFQUFtRixTQUFBO21CQUFHLElBQUk7UUFBUCxDQUFuRixDQUZTO0tBOUliO0lBcUpBLE9BQUEsRUFBUztRQUNMLENBQUEsQ0FBRSxhQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxPQUFKLENBQVksRUFBWjtRQUFILENBQW5GLENBREs7S0FySlQ7SUE0SkEsSUFBQSxFQUFNO1FBQ0YsQ0FBQSxDQUFFLGlEQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxJQUFKLENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakI7UUFBSCxDQUFuRixDQURFLEVBRUYsQ0FBQSxDQUFFLGlCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxJQUFKLENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakI7UUFBSCxDQUFuRixDQUZFO0tBNUpOO0lBbUtBLFNBQUEsRUFBVztRQUNQLENBQUEsQ0FBRSxJQUFGLEVBQW1GLFNBQUE7bUJBQUc7UUFBSCxDQUFuRixDQURPLEVBRVAsQ0FBQSxDQUFFLElBQUYsRUFBbUYsU0FBQTttQkFBRztRQUFILENBQW5GLENBRk87S0FuS1g7SUF3S0EsUUFBQSxFQUFVLENBQ04sQ0FBQSxDQUFFLEVBQUYsQ0FETSxFQUVOLENBQUEsQ0FBRSxHQUFGLENBRk0sQ0F4S1Y7SUErS0EsU0FBQSxFQUFXO1FBQ1AsQ0FBQSxDQUFFLEVBQUYsRUFBbUYsU0FBQTttQkFBRztRQUFILENBQW5GLENBRE8sRUFFUCxDQUFBLENBQUUsT0FBRixFQUFtRixTQUFBO21CQUFHLENBQUMsRUFBRDtRQUFILENBQW5GLENBRk8sRUFHUCxDQUFBLENBQUUsbUJBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsTUFBSCxDQUFVLEVBQVY7UUFBSCxDQUFuRixDQUhPLEVBSVAsQ0FBQSxDQUFFLHFDQUFGLEVBQW1GLFNBQUE7bUJBQUcsRUFBRSxDQUFDLE1BQUgsQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FKTyxFQUtQLENBQUEsQ0FBRSxzREFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsRUFBVjtRQUFILENBQW5GLENBTE87S0EvS1g7SUF5TEEsS0FBQSxFQUFPO1FBQ0gsQ0FBQSxDQUFFLFVBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FERyxFQUVILENBQUEsQ0FBRSxjQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsRUFBVixFQUFjLElBQWQsRUFBb0IsSUFBcEI7UUFBSCxDQUFuRixDQUZHLEVBR0gsQ0FBQSxDQUFFLHVCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsRUFBVixFQUFjLEVBQWQ7UUFBSCxDQUFuRixDQUhHLEVBSUgsQ0FBQSxDQUFFLEtBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJO1FBQVAsQ0FBbkYsQ0FKRztLQXpMUDtJQWtNQSxRQUFBLEVBQVUsQ0FDTixDQUFBLENBQUUsWUFBRixDQURNLEVBRU4sQ0FBQSxDQUFFLGNBQUYsQ0FGTSxFQUdOLENBQUEsQ0FBRSxPQUFGLENBSE0sRUFJTixDQUFBLENBQUUsUUFBRixDQUpNLENBbE1WO0lBMk1BLEtBQUEsRUFBTztRQUNILENBQUEsQ0FBRSxnQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVY7UUFBSCxDQUFuRixDQURHO0tBM01QO0lBaU5BLGdCQUFBLEVBQWtCO1FBQ2QsQ0FBQSxDQUFFLFlBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FEYyxFQUVkLENBQUEsQ0FBRSxnQkFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxHQUFILENBQU8sRUFBUDtRQUFILENBQW5GLENBRmMsRUFHZCxDQUFBLENBQUUscUJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWLEVBQWMsRUFBRSxDQUFDLE1BQUgsQ0FBVSxFQUFWLENBQWQ7UUFBSCxDQUFuRixDQUhjLEVBSWQsQ0FBQSxDQUFFLGNBQUYsQ0FKYztLQWpObEI7SUEwTkEsVUFBQSxFQUFZO1FBQ1IsQ0FBQSxDQUFFLGtCQUFGLENBRFEsRUFFUixDQUFBLENBQUUsT0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVY7UUFBSCxDQUFuRixDQUZRLEVBR1IsQ0FBQSxDQUFFLFFBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FIUTtLQTFOWjtJQWtPQSxLQUFBLEVBQU87UUFDSCxDQUFBLENBQUUsWUFBRixDQURHLEVBRUgsQ0FBQSxDQUFFLFNBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FGRyxFQUdILENBQUEsQ0FBRSxlQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsRUFBVjtRQUFILENBQW5GLENBSEcsRUFJSCxDQUFBLENBQUUsT0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVY7UUFBSCxDQUFuRixDQUpHLEVBS0gsQ0FBQSxDQUFFLE1BQUYsQ0FMRztLQWxPUDtJQTRPQSxRQUFBLEVBQVU7UUFDTixDQUFBLENBQUUsY0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLEVBQVg7UUFBSCxDQUFuRixDQURNLEVBRU4sQ0FBQSxDQUFFLGNBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxFQUFYLEVBQWUsTUFBZjtRQUFILENBQW5GLENBRk0sRUFHTixDQUFBLENBQUUsY0FBRixFQUFtRixTQUFBO21CQUFHLENBQUMsR0FBQSxDQUFJLENBQUosQ0FBQSxDQUFPLElBQUksTUFBSixDQUFXLElBQUksWUFBSixDQUFpQixXQUFqQixDQUFYLENBQVAsQ0FBRCxFQUFtRCxHQUFBLENBQUksQ0FBSixDQUFBLENBQU8sSUFBSSxNQUFKLENBQVcsRUFBWCxDQUFQLENBQW5EO1FBQUgsQ0FBbkYsQ0FITSxFQUlOLENBQUEsQ0FBRSxjQUFGLEVBQW1GLFNBQUE7bUJBQUcsQ0FBQyxHQUFBLENBQUksQ0FBSixDQUFBLENBQU8sSUFBSSxNQUFKLENBQVcsSUFBSSxZQUFKLENBQWlCLFdBQWpCLENBQVgsRUFBMEMsTUFBMUMsQ0FBUCxDQUFELEVBQTJELEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLE1BQUosQ0FBVyxFQUFYLENBQVAsQ0FBM0Q7UUFBSCxDQUFuRixDQUpNLEVBS04sQ0FBQSxDQUFFLElBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxJQUFJLFlBQUosQ0FBaUIsV0FBakIsQ0FBWDtRQUFILENBQW5GLENBTE0sRUFNTixDQUFBLENBQUUsT0FBRixDQU5NO0tBNU9WO0lBdVBBLEtBQUEsRUFBTztRQUNILENBQUEsQ0FBRSxrQ0FBRixFQUFtRixTQUFBO21CQUFHO1FBQUgsQ0FBbkYsQ0FERyxFQUVILENBQUEsQ0FBRSxxQkFBRixFQUFtRixTQUFBO21CQUFHLE1BQUEsQ0FBTyxFQUFQLEVBQVc7Z0JBQUEsSUFBQSxFQUFPLElBQVA7YUFBWDtRQUFILENBQW5GLENBRkc7S0F2UFA7SUE0UEEsVUFBQSxFQUFZO1FBQ1IsQ0FBQSxDQUFFLFlBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FEUSxFQUVSLENBQUEsQ0FBRSxPQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsRUFBVjtRQUFILENBQW5GLENBRlE7S0E1UFo7SUFtUUEsTUFBQSxFQUFRO1FBQ0osQ0FBQSxDQUFFLHlCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxHQUFKLENBQVEsRUFBUixFQUFZLEVBQUUsQ0FBQyxTQUFmO1FBQUgsQ0FBbkYsQ0FESTtLQW5RUjtJQXlRQSxVQUFBLEVBQVk7UUFDUixDQUFBLENBQUUsRUFBRixFQUFtRixTQUFBO21CQUFHO1FBQUgsQ0FBbkYsQ0FEUSxFQUVSLENBQUEsQ0FBRSxXQUFGLEVBQW1GLFNBQUE7bUJBQUcsQ0FBQyxFQUFEO1FBQUgsQ0FBbkYsQ0FGUSxFQUdSLENBQUEsQ0FBRSx3QkFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsRUFBVjtRQUFILENBQW5GLENBSFEsRUFJUixDQUFBLENBQUUsMENBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsTUFBSCxDQUFVLEVBQVY7UUFBSCxDQUFuRixDQUpRLEVBS1IsQ0FBQSxDQUFFLHdEQUFGLEVBQW1GLFNBQUE7bUJBQUcsRUFBRSxDQUFDLE1BQUgsQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FMUTtLQXpRWjtJQW1SQSxLQUFBLEVBQU87UUFDSCxDQUFBLENBQUUsT0FBRixFQUFtRixTQUFBO21CQUFHLElBQUk7UUFBUCxDQUFuRixDQURHLEVBRUgsQ0FBQSxDQUFFLGFBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxJQUFWLEVBQWdCLElBQWhCLEVBQXNCLEVBQXRCO1FBQUgsQ0FBbkYsQ0FGRyxFQUdILENBQUEsQ0FBRSwwQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLElBQVYsRUFBZ0IsRUFBaEI7UUFBSCxDQUFuRixDQUhHLEVBSUgsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsSUFBVixFQUFnQixFQUFoQixFQUFvQixFQUFwQjtRQUFILENBQW5GLENBSkcsRUFLSCxDQUFBLENBQUUsd0JBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FMRyxFQU1ILENBQUEsQ0FBRSw4QkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYyxJQUFkLEVBQW9CLEVBQXBCO1FBQUgsQ0FBbkYsQ0FORyxFQU9ILENBQUEsQ0FBRSwyQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYyxFQUFkO1FBQUgsQ0FBbkYsQ0FQRyxFQVFILENBQUEsQ0FBRSxpREFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYyxFQUFkLEVBQWtCLEVBQWxCO1FBQUgsQ0FBbkYsQ0FSRztLQW5SUDtJQThSQSxNQUFBLEVBQVE7UUFDSixDQUFBLENBQUUsZUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksaUJBQUosQ0FBc0IsSUFBdEIsRUFBNEIsRUFBNUI7UUFBSCxDQUFuRixDQURJLEVBRUosQ0FBQSxDQUFFLDJDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxpQkFBSixDQUFzQixJQUFJLFlBQUosQ0FBaUIsRUFBakIsRUFBcUIsSUFBckIsQ0FBdEIsRUFBa0QsRUFBbEQ7UUFBSCxDQUFuRixDQUZJLEVBR0osQ0FBQSxDQUFFLDZDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxpQkFBSixDQUFzQixJQUFJLFlBQUosQ0FBaUIsSUFBakIsRUFBdUIsRUFBdkIsQ0FBdEIsRUFBa0QsRUFBbEQ7UUFBSCxDQUFuRixDQUhJLEVBSUosQ0FBQSxDQUFFLHdCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxpQkFBSixDQUFzQixJQUFJLFlBQUosQ0FBaUIsSUFBakIsRUFBdUIsSUFBSSxtQkFBSixDQUF3QixFQUF4QixDQUF2QixDQUF0QixFQUEwRSxFQUExRTtRQUFILENBQW5GLENBSkksRUFLSixDQUFBLENBQUUscURBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGlCQUFKLENBQXNCLElBQUksWUFBSixDQUFpQixJQUFqQixFQUF1QixJQUFJLG1CQUFKLENBQXdCLEVBQXhCLENBQXZCLENBQXRCLEVBQTBFLEVBQTFFO1FBQUgsQ0FBbkYsQ0FMSSxFQU1KLENBQUEsQ0FBRSxzRUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksaUJBQUosQ0FBc0IsSUFBSSxZQUFKLENBQWlCLEVBQWpCLEVBQXFCLEVBQXJCLENBQXRCLEVBQWdELEVBQWhEO1FBQUgsQ0FBbkYsQ0FOSSxFQU9KLENBQUEsQ0FBRSw4RUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksaUJBQUosQ0FBc0IsSUFBSSxZQUFKLENBQWlCLEVBQWpCLEVBQXFCLElBQUksbUJBQUosQ0FBd0IsRUFBeEIsQ0FBckIsQ0FBdEIsRUFBd0UsRUFBeEU7UUFBSCxDQUFuRixDQVBJO0tBOVJSO0lBd1NBLG1CQUFBLEVBQXFCO1FBQ2pCLENBQUEsQ0FBRSxpQkFBRixFQUFtRixTQUFBO21CQUFHLENBQUMsRUFBRDtRQUFILENBQW5GLENBRGlCLEVBRWpCLENBQUEsQ0FBRSx1Q0FBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsRUFBVjtRQUFILENBQW5GLENBRmlCLEVBR2pCLENBQUEsQ0FBRSx5REFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsRUFBVjtRQUFILENBQW5GLENBSGlCLEVBSWpCLENBQUEsQ0FBRSw2Q0FBRixFQUFtRixTQUFBO21CQUFHO1FBQUgsQ0FBbkYsQ0FKaUIsRUFLakIsQ0FBQSxDQUFFLDBFQUFGLEVBQW1GLFNBQUE7bUJBQUcsRUFBRSxDQUFDLE1BQUgsQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FMaUI7S0F4U3JCO0lBZ1RBLGVBQUEsRUFBaUI7UUFDYixDQUFBLENBQUUsWUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksZUFBSixDQUFvQixFQUFwQjtRQUFILENBQW5GLENBRGEsRUFFYixDQUFBLENBQUUsMEJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGVBQUosQ0FBb0IsRUFBcEIsRUFBd0IsRUFBeEI7UUFBSCxDQUFuRixDQUZhLEVBR2IsQ0FBQSxDQUFFLFNBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGVBQUosQ0FBb0IsSUFBSSxPQUFKLENBQVksRUFBWixDQUFwQjtRQUFILENBQW5GLENBSGEsRUFJYixDQUFBLENBQUUsdUJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGVBQUosQ0FBb0IsSUFBSSxPQUFKLENBQVksRUFBWixDQUFwQixFQUFxQyxFQUFyQztRQUFILENBQW5GLENBSmE7S0FoVGpCO0lBdVRBLHNCQUFBLEVBQXdCO1FBQ3BCLENBQUEsQ0FBRSxZQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxzQkFBSixDQUEyQixFQUEzQjtRQUFILENBQW5GLENBRG9CO0tBdlR4QjtJQTJUQSx3QkFBQSxFQUEwQjtRQUN0QixDQUFBLENBQUUsMEJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLHdCQUFKLENBQTZCLElBQUksT0FBSixDQUFZLEVBQVosQ0FBN0IsRUFBOEMsRUFBOUM7UUFBSCxDQUFuRixDQURzQjtLQTNUMUI7SUErVEEsTUFBQSxFQUFRO1FBQ0osQ0FBQSxDQUFFLFlBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLHNCQUFKLENBQTJCLElBQUksbUJBQUosQ0FBd0IsRUFBeEIsQ0FBM0I7UUFBSCxDQUFuRixDQURJLEVBRUosQ0FBQSxDQUFFLHlDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxzQkFBSixDQUEyQixJQUFJLG1CQUFKLENBQXdCLEVBQXhCLENBQTNCO1FBQUgsQ0FBbkYsQ0FGSSxFQUdKLENBQUEsQ0FBRSxjQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxzQkFBSixDQUEyQixFQUEzQjtRQUFILENBQW5GLENBSEksRUFJSixDQUFBLENBQUUsZ0NBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLHNCQUFKLENBQTJCLElBQUksTUFBSixDQUFXLEVBQVgsRUFBZSxFQUFmLEVBQW1CLElBQW5CLEVBQXlCO2dCQUFBLGlCQUFBLEVBQW1CLFFBQW5CO2FBQXpCLENBQTNCO1FBQUgsQ0FBbkYsQ0FKSSxFQUtKLENBQUEsQ0FBRSwyQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksc0JBQUosQ0FBMkIsSUFBSSxNQUFKLENBQVcsRUFBWCxFQUFlLEVBQWYsRUFBbUIsSUFBbkIsRUFBeUI7Z0JBQUEsaUJBQUEsRUFBbUIsUUFBbkI7YUFBekIsQ0FBM0I7UUFBSCxDQUFuRixDQUxJLEVBTUosQ0FBQSxDQUFFLCtDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxzQkFBSixDQUEyQixJQUFJLE1BQUosQ0FBVyxFQUFYLEVBQWUsRUFBZixFQUFtQixJQUFuQixFQUF5QjtnQkFBQSxpQkFBQSxFQUFtQixRQUFuQjthQUF6QixDQUEzQjtRQUFILENBQW5GLENBTkksRUFPSixDQUFBLENBQUUsMkJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLHdCQUFKLENBQTZCLEVBQTdCO1FBQUgsQ0FBbkYsQ0FQSSxFQVFKLENBQUEsQ0FBRSxzQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksd0JBQUosQ0FBNkIsSUFBSSxLQUFKLENBQVUsRUFBVixDQUE3QjtRQUFILENBQW5GLENBUkksRUFTSixDQUFBLENBQUUsK0JBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLG9CQUFKLENBQXlCLElBQUksT0FBSixDQUFZLEVBQVosQ0FBekIsRUFBMEMsRUFBMUM7UUFBSCxDQUFuRixDQVRJLEVBVUosQ0FBQSxDQUFFLHFEQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxzQkFBSixDQUEyQixJQUFJLG1CQUFKLENBQXdCLEVBQXhCLENBQTNCLEVBQXdELEVBQXhEO1FBQUgsQ0FBbkYsQ0FWSTtLQS9UUjtJQTRVQSxtQkFBQSxFQUFxQjtRQUNqQixDQUFBLENBQUUsaUJBQUYsRUFBbUYsU0FBQTttQkFBRyxDQUFDLEVBQUQ7UUFBSCxDQUFuRixDQURpQixFQUVqQixDQUFBLENBQUUsdUNBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsTUFBSCxDQUFVLEVBQVY7UUFBSCxDQUFuRixDQUZpQixFQUdqQixDQUFBLENBQUUseURBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsTUFBSCxDQUFVLEVBQVY7UUFBSCxDQUFuRixDQUhpQixFQUlqQixDQUFBLENBQUUsNkNBQUYsRUFBbUYsU0FBQTttQkFBRztRQUFILENBQW5GLENBSmlCLEVBS2pCLENBQUEsQ0FBRSwwRUFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsRUFBVjtRQUFILENBQW5GLENBTGlCO0tBNVVyQjtJQW9WQSxlQUFBLEVBQWlCO1FBQ2IsQ0FBQSxDQUFFLFlBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGVBQUosQ0FBb0IsRUFBcEI7UUFBSCxDQUFuRixDQURhLEVBRWIsQ0FBQSxDQUFFLDBCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxlQUFKLENBQW9CLEVBQXBCLEVBQXdCLEVBQXhCO1FBQUgsQ0FBbkYsQ0FGYSxFQUdiLENBQUEsQ0FBRSx1QkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksZUFBSixDQUFvQixFQUFwQixFQUF3QixJQUFJLE9BQUosQ0FBWSxFQUFaLENBQXhCO1FBQUgsQ0FBbkYsQ0FIYSxFQUliLENBQUEsQ0FBRSxTQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxlQUFKLENBQW9CLElBQUksT0FBSixDQUFZLEVBQVosQ0FBcEI7UUFBSCxDQUFuRixDQUphLEVBS2IsQ0FBQSxDQUFFLHVCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxlQUFKLENBQW9CLElBQUksT0FBSixDQUFZLEVBQVosQ0FBcEIsRUFBcUMsRUFBckM7UUFBSCxDQUFuRixDQUxhO0tBcFZqQjtJQThWQSxVQUFBLEVBQVk7UUFDUixDQUFBLENBQUUsMkJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLGtCQUFKLENBQXVCLEVBQXZCLEVBQTJCLEVBQTNCLEVBQStCLEVBQS9CO1FBQUgsQ0FBbkYsQ0FEUSxFQUVSLENBQUEsQ0FBRSw4QkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksSUFBSixDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCO1FBQUgsQ0FBbkYsQ0FGUSxFQUdSLENBQUEsQ0FBRSxtQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksSUFBSixDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCO1FBQUgsQ0FBbkYsQ0FIUSxFQUlSLENBQUEsQ0FBRSxPQUFGLENBSlE7S0E5Vlo7SUFxV0EsS0FBQSxFQUFPO1FBQ0gsQ0FBQSxDQUFFLE9BQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJO1FBQVAsQ0FBbkYsQ0FERyxFQUVILENBQUEsQ0FBRSxpQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksU0FBSixDQUFjLEVBQWQ7UUFBSCxDQUFuRixDQUZHO0tBcldQO0lBNFdBLFlBQUEsRUFBYztRQUNWLENBQUEsQ0FBRSxFQUFGLEVBQW1GLFNBQUE7bUJBQUc7UUFBSCxDQUFuRixDQURVLEVBRVYsQ0FBQSxDQUFFLFlBQUYsRUFBbUYsU0FBQTttQkFBRztRQUFILENBQW5GLENBRlU7S0E1V2Q7SUFtWEEsU0FBQSxFQUFXO1FBQ1AsQ0FBQSxDQUFFLHFCQUFGLEVBQW1GLFNBQUE7bUJBQUc7UUFBSCxDQUFuRixDQURPLEVBRVAsQ0FBQSxDQUFFLHNDQUFGLEVBQW1GLFNBQUE7bUJBQUc7UUFBSCxDQUFuRixDQUZPO0tBblhYO0lBd1hBLElBQUEsRUFBTTtRQUNGLENBQUEsQ0FBRSxNQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsSUFBSSxXQUFkO1FBQUgsQ0FBbkYsQ0FERSxFQUVGLENBQUEsQ0FBRSxHQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsSUFBSSxXQUFkO1FBQUgsQ0FBbkYsQ0FGRTtLQXhYTjtJQTZYQSxZQUFBLEVBQWM7UUFDVixDQUFBLENBQUUsWUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLFdBQVgsQ0FBVixFQUFtQyxDQUFDLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLE1BQUosQ0FBVyxFQUFYLENBQVAsQ0FBRCxDQUFuQyxFQUE2RCxNQUE3RDtRQUFILENBQW5GLENBRFU7S0E3WGQ7SUFpWUEsS0FBQSxFQUFPO1FBQ0gsQ0FBQSxDQUFFLEtBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEdBQUosQ0FBUSxFQUFSO1FBQUgsQ0FBbkYsQ0FERyxFQUVILENBQUEsQ0FBRSxzQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksR0FBSixDQUFRLEVBQVI7UUFBSCxDQUFuRixDQUZHO0tBallQO0lBc1lBLFNBQUEsRUFBVztRQUNQLENBQUEsQ0FBRSxJQUFGLEVBQW1GLFNBQUE7bUJBQUc7UUFBSCxDQUFuRixDQURPLEVBRVAsQ0FBQSxDQUFFLEtBQUYsRUFBbUYsU0FBQTttQkFBRztRQUFILENBQW5GLENBRk87S0F0WVg7SUEyWUEsS0FBQSxFQUFPO1FBQ0gsQ0FBQSxDQUFFLHFDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsRUFBVixFQUFjLEVBQWQsRUFBa0IsRUFBbEI7UUFBSCxDQUFuRixDQURHO0tBM1lQO0lBaVpBLEtBQUEsRUFBTztRQUNILENBQUEsQ0FBRSxpQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYyxFQUFkLEVBQWtCLEVBQWxCO1FBQUgsQ0FBbkYsQ0FERyxFQUVILENBQUEsQ0FBRSxzQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEVBQVYsRUFBYyxJQUFkLEVBQW9CLEVBQXBCO1FBQUgsQ0FBbkYsQ0FGRyxFQUdILENBQUEsQ0FBRSxzQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLElBQVYsRUFBZ0IsRUFBaEIsRUFBb0IsRUFBcEI7UUFBSCxDQUFuRixDQUhHLEVBSUgsQ0FBQSxDQUFFLFdBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxJQUFWLEVBQWdCLElBQWhCLEVBQXNCLEVBQXRCO1FBQUgsQ0FBbkYsQ0FKRztLQWpaUDtJQXdaQSxRQUFBLEVBQVU7UUFDTixDQUFBLENBQUUsaUNBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWLEVBQWMsRUFBZCxFQUFrQixFQUFsQjtRQUFILENBQW5GLENBRE07S0F4WlY7SUErWkEsT0FBQSxFQUFTO1FBQ0wsQ0FBQSxDQUFFLEtBQUYsRUFBbUYsU0FBQTttQkFBRyxDQUFDLEVBQUQ7UUFBSCxDQUFuRixDQURLLEVBRUwsQ0FBQSxDQUFFLGVBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsTUFBSCxDQUFVLEVBQVY7UUFBSCxDQUFuRixDQUZLLEVBR0wsQ0FBQSxDQUFFLGlDQUFGLEVBQW1GLFNBQUE7bUJBQUcsRUFBRSxDQUFDLE1BQUgsQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FISyxFQUlMLENBQUEsQ0FBRSxpQ0FBRixFQUFtRixTQUFBO21CQUFHO1FBQUgsQ0FBbkYsQ0FKSyxFQUtMLENBQUEsQ0FBRSxrREFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsRUFBVjtRQUFILENBQW5GLENBTEs7S0EvWlQ7SUF5YUEsR0FBQSxFQUFLO1FBQ0QsQ0FBQSxDQUFFLFlBQUYsQ0FEQyxFQUVELENBQUEsQ0FBRSxPQUFGLENBRkMsRUFHRCxDQUFBLENBQUUsS0FBRixFQUFtRixTQUFBO21CQUFHLElBQUk7UUFBUCxDQUFuRixDQUhDO0tBemFMO0lBa2JBLFVBQUEsRUFBWTtRQUNSLENBQUEsQ0FBRSxZQUFGLENBRFEsRUFFUixDQUFBLENBQUUseUJBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsTUFBSCxDQUFVLEVBQVYsRUFBYyxFQUFkO1FBQUgsQ0FBbkYsQ0FGUTtLQWxiWjtJQXliQSxHQUFBLEVBQUs7UUFDRCxDQUFBLENBQUUsV0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksR0FBSixDQUFRLEVBQVI7UUFBSCxDQUFuRixDQURDLEVBRUQsQ0FBQSxDQUFFLGlCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxHQUFKLENBQVEsRUFBUixFQUFZLEVBQUcsQ0FBQSxDQUFBLENBQWYsRUFBbUIsRUFBRyxDQUFBLENBQUEsQ0FBdEI7UUFBSCxDQUFuRixDQUZDLEVBR0QsQ0FBQSxDQUFFLHlCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxHQUFKLENBQVEsRUFBUixFQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsRUFBeEI7UUFBSCxDQUFuRixDQUhDLEVBSUQsQ0FBQSxDQUFFLCtCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxHQUFKLENBQVEsRUFBUixFQUFZLEVBQUcsQ0FBQSxDQUFBLENBQWYsRUFBbUIsRUFBRyxDQUFBLENBQUEsQ0FBdEIsRUFBMEIsRUFBMUI7UUFBSCxDQUFuRixDQUpDO0tBemJMO0lBa2NBLEtBQUEsRUFBTztRQUNILENBQUEsQ0FBRSx3QkFBRixFQUFtRixTQUFBO21CQUFHLENBQUMsRUFBRCxFQUFLLEVBQUw7UUFBSCxDQUFuRixDQURHLEVBRUgsQ0FBQSxDQUFFLG9CQUFGLEVBQW1GLFNBQUE7bUJBQUcsQ0FBQyxHQUFBLENBQUksQ0FBSixDQUFBLENBQU8sSUFBSSxLQUFKLENBQVUsRUFBVixDQUFQLENBQUQsRUFBd0IsRUFBeEI7UUFBSCxDQUFuRixDQUZHLEVBR0gsQ0FBQSxDQUFFLGFBQUYsRUFBbUYsU0FBQTttQkFBRyxDQUFDLElBQUQsRUFBTyxFQUFQO1FBQUgsQ0FBbkYsQ0FIRztLQWxjUDtJQXdjQSxLQUFBLEVBQU87UUFDSCxDQUFBLENBQUUsa0JBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FERztLQXhjUDtJQWdkQSxhQUFBLEVBQWU7UUFDWCxDQUFBLENBQUUsVUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLEVBQVg7UUFBSCxDQUFuRixDQURXLEVBRVgsQ0FBQSxDQUFFLHlCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxNQUFKLENBQVcsRUFBWDtRQUFILENBQW5GLENBRlc7S0FoZGY7SUF1ZEEsV0FBQSxFQUFhO1FBQ1QsQ0FBQSxDQUFFLGtCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsRUFBVjtRQUFILENBQW5GLENBRFMsRUFFVCxDQUFBLENBQUUsa0NBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWLEVBQWM7Z0JBQUEsS0FBQSxFQUFPLEVBQVA7YUFBZDtRQUFILENBQW5GLENBRlMsRUFHVCxDQUFBLENBQUUsa0JBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWLEVBQWM7Z0JBQUEsTUFBQSxFQUFRLElBQVI7YUFBZDtRQUFILENBQW5GLENBSFMsRUFJVCxDQUFBLENBQUUsa0NBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWLEVBQWM7Z0JBQUEsTUFBQSxFQUFRLElBQVI7Z0JBQWMsS0FBQSxFQUFPLEVBQXJCO2FBQWQ7UUFBSCxDQUFuRixDQUpTO0tBdmRiO0lBaWVBLEtBQUEsRUFBTztRQUNILENBQUEsQ0FBRSxtQkFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxPQUFILENBQVcsRUFBWDtRQUFILENBQW5GLENBREcsRUFFSCxDQUFBLENBQUUsMEJBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsT0FBSCxDQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsRUFBRCxDQUFYLENBQVAsQ0FBWDtRQUFILENBQW5GLENBRkcsRUFHSCxDQUFBLENBQUUsd0JBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsT0FBSCxDQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsRUFBRCxDQUFYLENBQVAsQ0FBWDtRQUFILENBQW5GLENBSEcsRUFJSCxDQUFBLENBQUUsTUFBRixFQUFtRixTQUFBO21CQUFHO1FBQUgsQ0FBbkYsQ0FKRztLQWplUDtJQXdlQSxJQUFBLEVBQU07UUFDRixDQUFBLENBQUUsWUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksS0FBSixDQUFVLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLGNBQUosQ0FBbUIsTUFBbkIsQ0FBUCxDQUFWLENBQTJDLENBQUMsT0FBNUMsQ0FBb0QsRUFBcEQ7UUFBSCxDQUFuRixDQURFLEVBRUYsQ0FBQSxDQUFFLGlCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsR0FBQSxDQUFJLENBQUosQ0FBQSxDQUFPLElBQUksY0FBSixDQUFtQixNQUFuQixDQUFQLENBQVYsQ0FBMkMsQ0FBQyxPQUE1QyxDQUFvRCxHQUFBLENBQUksQ0FBSixDQUFBLENBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLEVBQUQsQ0FBWCxDQUFQLENBQXBEO1FBQUgsQ0FBbkYsQ0FGRTtLQXhlTjtJQWdmQSxHQUFBLEVBQUs7UUFDRCxDQUFBLENBQUUsbUJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEdBQUosQ0FBUSxFQUFSLEVBQVksRUFBWjtRQUFILENBQW5GLENBREMsRUFFRCxDQUFBLENBQUUsb0JBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEdBQUosQ0FBUSxFQUFSLEVBQVksRUFBWjtRQUFILENBQW5GLENBRkMsRUFHRCxDQUFBLENBQUUsZUFBRixFQUFtRixTQUFBO21CQUFHLElBQUksR0FBSixDQUFRLEVBQVIsRUFBWSxFQUFaO1FBQUgsQ0FBbkYsQ0FIQztLQWhmTDtJQXNmQSxPQUFBLEVBQVM7UUFDTCxDQUFBLENBQUUsV0FBRixFQUFtRixTQUFBO21CQUFHO2dCQUFBLE1BQUEsRUFBUyxHQUFBLENBQUksQ0FBSixDQUFBLENBQU8sSUFBSSxLQUFKLENBQVUsRUFBVixDQUFQLENBQVQ7O1FBQUgsQ0FBbkYsQ0FESyxFQUVMLENBQUEsQ0FBRSx5QkFBRixFQUFtRixTQUFBO21CQUFHO2dCQUFBLE1BQUEsRUFBUyxHQUFBLENBQUksQ0FBSixDQUFBLENBQU8sSUFBSSxLQUFKLENBQVUsRUFBVixDQUFQLENBQVQ7Z0JBQWdDLElBQUEsRUFBTSxFQUF0Qzs7UUFBSCxDQUFuRixDQUZLLEVBR0wsQ0FBQSxDQUFFLG9CQUFGLEVBQW1GLFNBQUE7WUFBRyxFQUFFLENBQUMsR0FBSCxHQUFTLEVBQUUsQ0FBQztZQUFLLEVBQUUsQ0FBQyxNQUFILEdBQVksRUFBRSxDQUFDO1lBQVEsRUFBRSxDQUFDLElBQUgsR0FBVSxFQUFHLENBQUEsQ0FBQTtZQUFJLEVBQUUsQ0FBQyxLQUFILEdBQVcsRUFBRyxDQUFBLENBQUE7bUJBQUk7UUFBOUUsQ0FBbkYsQ0FISztLQXRmVDtJQTRmQSxRQUFBLEVBQVU7UUFDTixDQUFBLENBQUUsa0JBQUYsRUFBbUYsU0FBQTttQkFBRztRQUFILENBQW5GLENBRE0sRUFFTixDQUFBLENBQUUsc0JBQUYsRUFBbUYsU0FBQTtZQUFHLEVBQUUsQ0FBQyxHQUFILEdBQVM7WUFBSyxFQUFFLENBQUMsTUFBSCxHQUFhLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxJQUFJLE9BQUosQ0FBWSxFQUFaLENBQVA7bUJBQXlCO1FBQXZELENBQW5GLENBRk07S0E1ZlY7SUFtZ0JBLFFBQUEsRUFBVTtRQUNOLENBQUEsQ0FBRSxZQUFGLENBRE0sRUFFTixDQUFBLENBQUUsY0FBRixDQUZNLEVBR04sQ0FBQSxDQUFFLE9BQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEtBQUosQ0FBVSxFQUFWO1FBQUgsQ0FBbkYsQ0FITSxFQUlOLENBQUEsQ0FBRSxRQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxLQUFKLENBQVUsRUFBVjtRQUFILENBQW5GLENBSk07S0FuZ0JWO0lBNmdCQSxZQUFBLEVBQWM7UUFDVixDQUFBLENBQUUsVUFBRixFQUFtRixTQUFBO21CQUFHLENBQUMsRUFBRDtRQUFILENBQW5GLENBRFUsRUFFVixDQUFBLENBQUUscUJBQUYsRUFBbUYsU0FBQTttQkFBRyxDQUFDLEVBQUQsRUFBSyxFQUFMO1FBQUgsQ0FBbkYsQ0FGVTtLQTdnQmQ7SUFxaEJBLFNBQUEsRUFBVztRQUNQLENBQUEsQ0FBRSxrQkFBRixFQUFtRixTQUFBO21CQUFHO2dCQUFBLE1BQUEsRUFBUSxFQUFSOztRQUFILENBQW5GLENBRE8sRUFFUCxDQUFBLENBQUUsa0JBQUYsRUFBbUYsU0FBQTttQkFBRztnQkFBQSxNQUFBLEVBQVEsRUFBUjtnQkFBWSxNQUFBLEVBQVEsSUFBcEI7O1FBQUgsQ0FBbkYsQ0FGTyxFQUdQLENBQUEsQ0FBRSxrQ0FBRixFQUFtRixTQUFBO21CQUFHO2dCQUFBLE1BQUEsRUFBUSxFQUFSO2dCQUFZLEtBQUEsRUFBTyxFQUFuQjs7UUFBSCxDQUFuRixDQUhPLEVBSVAsQ0FBQSxDQUFFLGtDQUFGLEVBQW1GLFNBQUE7bUJBQUc7Z0JBQUEsTUFBQSxFQUFRLEVBQVI7Z0JBQVksS0FBQSxFQUFPLEVBQW5CO2dCQUF1QixNQUFBLEVBQVEsSUFBL0I7O1FBQUgsQ0FBbkYsQ0FKTyxFQUtQLENBQUEsQ0FBRSxnQ0FBRixFQUFtRixTQUFBO21CQUFHO2dCQUFBLE1BQUEsRUFBUSxFQUFSO2dCQUFZLElBQUEsRUFBTyxFQUFuQjs7UUFBSCxDQUFuRixDQUxPLEVBTVAsQ0FBQSxDQUFFLGdEQUFGLEVBQW1GLFNBQUE7bUJBQUc7Z0JBQUEsTUFBQSxFQUFRLEVBQVI7Z0JBQVksS0FBQSxFQUFPLEVBQW5CO2dCQUF1QixJQUFBLEVBQU0sRUFBN0I7O1FBQUgsQ0FBbkYsQ0FOTyxFQU9QLENBQUEsQ0FBRSxnREFBRixFQUFtRixTQUFBO21CQUFHO2dCQUFBLE1BQUEsRUFBUSxFQUFSO2dCQUFZLElBQUEsRUFBTyxFQUFuQjtnQkFBdUIsS0FBQSxFQUFPLEVBQTlCOztRQUFILENBQW5GLENBUE8sRUFRUCxDQUFBLENBQUUsb0JBQUYsRUFBbUYsU0FBQTttQkFBRztnQkFBQSxNQUFBLEVBQVEsRUFBUjtnQkFBWSxJQUFBLEVBQU8sSUFBbkI7O1FBQUgsQ0FBbkYsQ0FSTyxFQVNQLENBQUEsQ0FBRSxvQ0FBRixFQUFtRixTQUFBO21CQUFHO2dCQUFBLE1BQUEsRUFBUSxFQUFSO2dCQUFZLEtBQUEsRUFBTyxFQUFuQjtnQkFBdUIsSUFBQSxFQUFNLElBQTdCOztRQUFILENBQW5GLENBVE8sRUFVUCxDQUFBLENBQUUsZ0JBQUYsRUFBbUYsU0FBQTttQkFBRztnQkFBQSxNQUFBLEVBQVEsRUFBUjs7UUFBSCxDQUFuRixDQVZPO0tBcmhCWDtJQWtpQkEsTUFBQSxFQUFRO1FBQ0osQ0FBQSxDQUFFLHdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxNQUFKLENBQVcsRUFBWCxFQUFlLEVBQWY7UUFBSCxDQUFuRixDQURJLEVBRUosQ0FBQSxDQUFFLG1EQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxNQUFKLENBQVcsRUFBWCxFQUFlLEVBQWYsRUFBbUIsRUFBbkI7UUFBSCxDQUFuRixDQUZJLEVBR0osQ0FBQSxDQUFFLDZCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxNQUFKLENBQVcsSUFBWCxFQUFpQixFQUFqQjtRQUFILENBQW5GLENBSEksRUFJSixDQUFBLENBQUUsd0NBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxJQUFYLEVBQWlCLEVBQWpCLEVBQXFCLEVBQXJCO1FBQUgsQ0FBbkYsQ0FKSTtLQWxpQlI7SUF5aUJBLEtBQUEsRUFBTztRQUNILENBQUEsQ0FBRSxNQUFGLENBREcsRUFFSCxDQUFBLENBQUUsWUFBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsRUFBVjtRQUFILENBQW5GLENBRkc7S0F6aUJQO0lBZ2pCQSxJQUFBLEVBQU07UUFDRixDQUFBLENBQUUsK0JBQUYsRUFBbUYsU0FBQTttQkFBRyxDQUFDLENBQUMsRUFBRCxFQUFLLEVBQUwsQ0FBRDtRQUFILENBQW5GLENBREUsRUFFRixDQUFBLENBQUUsMENBQUYsRUFBbUYsU0FBQTttQkFBRyxDQUFDLENBQUMsRUFBRCxFQUFLLEVBQUwsQ0FBRDtRQUFILENBQW5GLENBRkU7S0FoakJOO0lBd2pCQSxXQUFBLEVBQWE7UUFDVCxDQUFBLENBQUUsMEJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxFQUFYLEVBQWUsRUFBZixFQUFtQjtnQkFBQSxJQUFBLEVBQU0sRUFBTjthQUFuQjtRQUFILENBQW5GLENBRFMsRUFFVCxDQUFBLENBQUUsZ0RBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsT0FBSCxDQUFXLEdBQUEsQ0FBSSxDQUFKLEVBQU0sQ0FBTixDQUFBLENBQVMsSUFBSSxNQUFKLENBQVcsRUFBWCxFQUFlLEVBQWYsRUFBbUI7Z0JBQUEsSUFBQSxFQUFNLEVBQU47YUFBbkIsQ0FBVCxDQUFYO1FBQUgsQ0FBbkYsQ0FGUztLQXhqQmI7SUE2akJBLE1BQUEsRUFBUTtRQUNKLENBQUEsQ0FBRSxhQUFGLENBREksRUFFSixDQUFBLENBQUUsNkJBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsT0FBSCxDQUFXLEVBQVg7UUFBSCxDQUFuRixDQUZJLEVBR0osQ0FBQSxDQUFFLG1DQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxNQUFKLENBQVcsRUFBWCxFQUFlLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsRUFBRCxDQUFYLENBQVAsQ0FBZixFQUF3QztnQkFBQSxJQUFBLEVBQU0sRUFBTjtnQkFBVSxTQUFBLEVBQVcsSUFBckI7YUFBeEM7UUFBSCxDQUFuRixDQUhJLEVBSUosQ0FBQSxDQUFFLG9DQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxNQUFKLENBQVcsRUFBWCxFQUFlLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsRUFBRCxDQUFYLENBQVAsQ0FBZixFQUF3QztnQkFBQSxJQUFBLEVBQU0sRUFBTjtnQkFBVSxTQUFBLEVBQVcsSUFBckI7YUFBeEM7UUFBSCxDQUFuRixDQUpJO0tBN2pCUjtJQW9rQkEsT0FBQSxFQUFTO1FBQ0wsQ0FBQSxDQUFFLHFCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZTtnQkFBQSxJQUFBLEVBQU0sRUFBTjthQUFmO1FBQUgsQ0FBbkYsQ0FESyxFQUVMLENBQUEsQ0FBRSxrQ0FBRixFQUFtRixTQUFBO21CQUFHLEVBQUUsQ0FBQyxPQUFILENBQVcsR0FBQSxDQUFJLENBQUosRUFBTSxDQUFOLENBQUEsQ0FBUyxJQUFJLEVBQUosQ0FBTyxFQUFQLEVBQVcsRUFBWCxFQUFlO2dCQUFBLElBQUEsRUFBTSxFQUFOO2FBQWYsQ0FBVCxDQUFYO1FBQUgsQ0FBbkYsQ0FGSztLQXBrQlQ7SUEya0JBLEVBQUEsRUFBSTtRQUNBLENBQUEsQ0FBRSxTQUFGLENBREEsRUFFQSxDQUFBLENBQUUsb0JBQUYsRUFBbUYsU0FBQTttQkFBRyxFQUFFLENBQUMsT0FBSCxDQUFXLEVBQVg7UUFBSCxDQUFuRixDQUZBLEVBR0EsQ0FBQSxDQUFFLDhCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsRUFBRCxDQUFYLENBQVAsQ0FBWCxFQUFvQztnQkFBQSxJQUFBLEVBQU0sRUFBTjtnQkFBVSxTQUFBLEVBQVcsSUFBckI7YUFBcEM7UUFBSCxDQUFuRixDQUhBLEVBSUEsQ0FBQSxDQUFFLCtCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEdBQUEsQ0FBSSxDQUFKLENBQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsRUFBRCxDQUFYLENBQVAsQ0FBWCxFQUFvQztnQkFBQSxJQUFBLEVBQU0sRUFBTjtnQkFBVSxTQUFBLEVBQVcsSUFBckI7YUFBcEM7UUFBSCxDQUFuRixDQUpBO0tBM2tCSjtJQXVsQkEsU0FBQSxFQUFXO1FBQ1AsQ0FBQSxDQUFFLGtCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFZLEVBQVo7UUFBSCxDQUFuRixDQURPLEVBRVAsQ0FBQSxDQUFFLHVCQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFZLEVBQVo7UUFBSCxDQUFuRixDQUZPLEVBR1AsQ0FBQSxDQUFFLGNBQUYsRUFBa0YsQ0FBQyxTQUFBO21CQUFHLElBQUksRUFBSixDQUFPLEdBQVAsRUFBWSxFQUFaO1FBQUgsQ0FBRCxDQUFsRixFQUF1RztZQUFBLElBQUEsRUFBTSxZQUFOO1NBQXZHLENBSE8sRUFJUCxDQUFBLENBQUUsY0FBRixFQUFrRixDQUFDLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sR0FBUCxFQUFZLEVBQVo7UUFBSCxDQUFELENBQWxGLEVBQXVHO1lBQUEsSUFBQSxFQUFNLFlBQU47U0FBdkcsQ0FKTyxFQU1QLENBQUEsQ0FBRSxxQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksRUFBSixDQUFPLElBQVAsRUFBWSxFQUFaO1FBQUgsQ0FBbkYsQ0FOTyxFQU9QLENBQUEsQ0FBRSxxQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksRUFBSixDQUFPLElBQVAsRUFBWSxFQUFaO1FBQUgsQ0FBbkYsQ0FQTyxFQVFQLENBQUEsQ0FBRSxxQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksRUFBSixDQUFPLElBQVAsRUFBWSxFQUFaLEVBQWdCLElBQWhCLEVBQXNCLElBQXRCO1FBQUgsQ0FBbkYsQ0FSTyxFQVNQLENBQUEsQ0FBRSxxQkFBRixFQUFtRixTQUFBO21CQUFHLElBQUksRUFBSixDQUFPLElBQVAsRUFBWSxFQUFaLEVBQWdCLElBQWhCLEVBQXNCLElBQXRCO1FBQUgsQ0FBbkYsQ0FUTyxFQVdQLENBQUEsQ0FBRSxjQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxTQUFKLENBQWMsRUFBZDtRQUFILENBQW5GLENBWE8sRUFhUCxDQUFBLENBQUUseUJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEVBQUosQ0FBTyxHQUFQLEVBQWEsRUFBYixFQUFpQixFQUFqQjtRQUFILENBQW5GLENBYk8sRUFjUCxDQUFBLENBQUUseUJBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLEVBQUosQ0FBTyxHQUFQLEVBQWEsRUFBYixFQUFpQixFQUFqQjtRQUFILENBQW5GLENBZE8sRUFnQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0FoQk8sRUFpQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0FqQk8sRUFrQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0FsQk8sRUFtQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0FuQk8sRUFvQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0FwQk8sRUFxQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0FyQk8sRUFzQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0F0Qk8sRUF1QlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0F2Qk8sRUF3QlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0F4Qk8sRUF5QlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmO1FBQUgsQ0FBbkYsQ0F6Qk8sRUEwQlAsQ0FBQSxDQUFFLGdDQUFGLEVBQW1GLFNBQUE7WUFBRyxJQUFHLEVBQUUsQ0FBQyxNQUFILENBQVUsQ0FBVixDQUFBLEtBQWdCLEdBQW5CO3VCQUE0QixJQUFJLEVBQUosQ0FBTyxFQUFHLFNBQVYsRUFBZ0IsRUFBaEIsRUFBb0IsRUFBcEIsQ0FBdUIsQ0FBQyxNQUF4QixDQUFBLEVBQTVCO2FBQUEsTUFBQTt1QkFBa0UsSUFBSSxFQUFKLENBQU8sRUFBUCxFQUFXLEVBQVgsRUFBZSxFQUFmLEVBQWxFOztRQUFILENBQW5GLENBMUJPLEVBNEJQLENBQUEsQ0FBRSw2Q0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksTUFBSixDQUFXLEVBQVgsRUFBZSxFQUFmLEVBQW1CLEVBQW5CO1FBQUgsQ0FBbkYsQ0E1Qk8sRUE2QlAsQ0FBQSxDQUFFLDREQUFGLEVBQW1GLFNBQUE7bUJBQUcsSUFBSSxNQUFKLENBQVcsRUFBWCxFQUFlLEVBQWYsRUFBbUIsRUFBbkI7UUFBSCxDQUFuRixDQTdCTyxFQThCUCxDQUFBLENBQUUsd0RBQUYsRUFBbUYsU0FBQTttQkFBRyxJQUFJLE1BQUosQ0FBVyxFQUFYLEVBQWUsRUFBZixFQUFtQixFQUFuQjtRQUFILENBQW5GLENBOUJPLEVBK0JQLENBQUEsQ0FBRSxxQ0FBRixFQUFtRixTQUFBO21CQUFHLElBQUksT0FBSixDQUFZLEVBQVosRUFBZ0IsRUFBaEI7UUFBSCxDQUFuRixDQS9CTztLQXZsQlg7OztBQW1vQkosU0FBQSxHQUFZLENBQ1IsQ0FBQyxNQUFELEVBQVksR0FBWixFQUFnQixJQUFoQixFQUFxQixJQUFyQixFQUEwQixLQUExQixDQURRLEVBRVIsQ0FBQyxNQUFELEVBQVksWUFBWixFQUF5QixVQUF6QixDQUZRLEVBR1IsQ0FBQyxVQUFELEVBQVksSUFBWixFQUFpQixJQUFqQixDQUhRLEVBSVIsQ0FBQyxNQUFELEVBQVksR0FBWixDQUpRLEVBS1IsQ0FBQyxPQUFELEVBQVksT0FBWixDQUxRLEVBTVIsQ0FBQyxPQUFELEVBQVksSUFBWixDQU5RLEVBT1IsQ0FBQyxPQUFELEVBQVksWUFBWixDQVBRLEVBUVIsQ0FBQyxNQUFELEVBQVksTUFBWixDQVJRLEVBU1IsQ0FBQyxNQUFELEVBQVksR0FBWixFQUFnQixHQUFoQixDQVRRLEVBVVIsQ0FBQyxNQUFELEVBQVksT0FBWixDQVZRLEVBV1IsQ0FBQyxNQUFELEVBQVksVUFBWixDQVhRLEVBWVIsQ0FBQyxNQUFELEVBQVksU0FBWixDQVpRLEVBYVIsQ0FBQyxNQUFELEVBQVksR0FBWixDQWJRLEVBY1IsQ0FBQyxNQUFELEVBQVksR0FBWixDQWRRLEVBZVIsQ0FBQyxNQUFELEVBQVksR0FBWixDQWZRLEVBZ0JSLENBQUMsTUFBRCxFQUFZLElBQVosQ0FoQlEsRUFpQlIsQ0FBQyxNQUFELEVBQVksSUFBWixDQWpCUSxFQWtCUixDQUFDLE1BQUQsRUFBWSxNQUFaLENBbEJRLEVBbUJSLENBQUMsVUFBRCxFQUFZLFFBQVosRUFBcUIsU0FBckIsQ0FuQlEsRUFvQlIsQ0FBQyxPQUFELEVBQVksT0FBWixDQXBCUSxFQXFCUixDQUFDLE9BQUQsRUFBWSxHQUFaLEVBQWdCLEdBQWhCLEVBQW9CLGlCQUFwQixFQUFzQyxRQUF0QyxFQUErQyxPQUEvQyxFQUF1RCxTQUF2RCxDQXJCUSxFQXNCUixDQUFDLE9BQUQsRUFBWSxPQUFaLEVBQW9CLE9BQXBCLEVBQTRCLFNBQTVCLEVBQXNDLElBQXRDLEVBQTJDLE1BQTNDLENBdEJRLEVBdUJSLENBQUMsT0FBRCxFQUFZLElBQVosRUFBaUIsU0FBakIsRUFBMkIsTUFBM0IsRUFBa0MsV0FBbEMsRUFBOEMsS0FBOUMsRUFBb0QsT0FBcEQsRUFBNEQsT0FBNUQsRUFBb0UsTUFBcEUsRUFBMkUsT0FBM0UsRUFBbUYsT0FBbkYsRUFBMkYsUUFBM0YsRUFBb0csUUFBcEcsQ0F2QlEsRUF3QlIsQ0FBQyxNQUFELEVBQVksU0FBWixFQUFzQixjQUF0QixDQXhCUTs7QUFnQ1osTUFBQSxHQUFTOztBQUNULEtBQUEsZUFBQTs7SUFDSSxPQUFRLENBQUEsSUFBQSxDQUFSOztBQUFnQjthQUFBLDhDQUFBOztBQUNaO0FBQUEsaUJBQUEsdUNBQUE7O2dCQUNJLElBQUEsQ0FBeUIsT0FBUSxDQUFBLEtBQUEsQ0FBakM7b0JBQUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxLQUFaLEVBQUE7O0FBREo7WUFFQSxJQUErQixJQUFBLEtBQVEsTUFBdkM7Z0JBQUEsR0FBSSxDQUFBLENBQUEsQ0FBSixHQUFTLFNBQUEsR0FBVSxHQUFJLENBQUEsQ0FBQSxFQUF2Qjs7eUJBQ0E7QUFKWTs7O0FBRHBCOztBQVVBLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLElBQUksTUFBSixDQUNiO0lBQUEsR0FBQSxFQUFhLE9BQWI7SUFDQSxNQUFBLEVBQWEsTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFaLENBRGI7SUFFQSxTQUFBLEVBQWEsU0FBUyxDQUFDLE9BQVYsQ0FBQSxDQUZiO0lBR0EsV0FBQSxFQUFhLE1BSGI7Q0FEYSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbjAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgIDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxuIyBUaGUgcGFyc2VyIGlzIGdlbmVyYXRlZCBieSBbSmlzb25dKGh0dHBzOi8vZ2l0aHViLmNvbS96YWFjaC9qaXNvbikgZnJvbSB0aGlzIGdyYW1tYXIgZmlsZS4gXG4jIFRoZSBga2FrZSBwYXJzZXJgIGNvbW1hbmQgY29uc3RydWN0cyBhIHBhcnNlIHRhYmxlIGZyb20gb3VyIHJ1bGVzIGFuZCBzYXZlcyBpdCBpbnRvIGBqcy9wYXJzZXIuanNgLlxuXG57IFBhcnNlciB9ID0gcmVxdWlyZSAnamlzb24nXG5cbiMgSmlzb24gRFNMXG4jIC0tLS0tLS0tLVxuIyBTaW5jZSB3ZSdyZSBnb2luZyB0byBiZSB3cmFwcGVkIGluIGEgZnVuY3Rpb24gYnkgSmlzb24gaW4gYW55IGNhc2UsIGlmIG91ciBhY3Rpb24gaW1tZWRpYXRlbHkgcmV0dXJucyBhIHZhbHVlLCBcbiMgd2UgY2FuIG9wdGltaXplIGJ5IHJlbW92aW5nIHRoZSBmdW5jdGlvbiB3cmFwcGVyIGFuZCBqdXN0IHJldHVybmluZyB0aGUgdmFsdWUgZGlyZWN0bHkuXG5cbnVud3JhcCA9IC9eZnVuY3Rpb25cXHMqXFwoXFwpXFxzKlxce1xccypyZXR1cm5cXHMqKFtcXHNcXFNdKik7XFxzKlxcfS9cblxuIyBPdXIgaGFuZHkgRFNMIGZvciBKaXNvbiBncmFtbWFyIGdlbmVyYXRpb24sIHRoYW5rcyB0byBbVGltIENhc3dlbGxdKGh0dHBzOi8vZ2l0aHViLmNvbS9jcmVhdGlvbml4KS4gXG4jIEZvciBldmVyeSBydWxlIGluIHRoZSBncmFtbWFyLCB3ZSBwYXNzIHRoZSBwYXR0ZXJuLWRlZmluaW5nIHN0cmluZywgdGhlIGFjdGlvbiB0byBydW4sIGFuZCBleHRyYSBvcHRpb25zLiBcbiMgSWYgbm8gYWN0aW9uIGlzIHNwZWNpZmllZCwgd2Ugc2ltcGx5IHBhc3MgdGhlIHZhbHVlIG9mIHRoZSBwcmV2aW91cyBub250ZXJtaW5hbC5cblxubyA9IChwYXR0ZXJuU3RyaW5nLCBhY3Rpb24sIG9wdGlvbnMpIC0+XG4gICAgcGF0dGVyblN0cmluZyA9IHBhdHRlcm5TdHJpbmcucmVwbGFjZSAvXFxzezIsfS9nLCAnICdcbiAgICBwYXR0ZXJuQ291bnQgPSBwYXR0ZXJuU3RyaW5nLnNwbGl0KCcgJykubGVuZ3RoXG4gICAgcmV0dXJuIFtwYXR0ZXJuU3RyaW5nLCAnJCQgPSAkMTsnICBvcHRpb25zXSB1bmxlc3MgYWN0aW9uXG4gICAgYWN0aW9uID0gaWYgbWF0Y2ggPSB1bndyYXAuZXhlYyBhY3Rpb24gdGhlbiBtYXRjaFsxXSBlbHNlIFwiKCN7YWN0aW9ufSgpKVwiXG5cbiAgICAjIEFsbCBydW50aW1lIGZ1bmN0aW9ucyB3ZSBuZWVkIGFyZSBkZWZpbmVkIG9uIFwieXlcIlxuICAgIGFjdGlvbiA9IGFjdGlvbi5yZXBsYWNlIC9cXGJuZXcgL2csICckJnl5LidcbiAgICBhY3Rpb24gPSBhY3Rpb24ucmVwbGFjZSAvXFxiKD86QmxvY2tcXC53cmFwfGV4dGVuZClcXGIvZywgJ3l5LiQmJ1xuXG4gICAgIyBSZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2ggYWRkcyBsb2NhdGlvbiBkYXRhIHRvIHRoZSBmaXJzdCBwYXJhbWV0ZXIgcGFzc2VkIGluLCBhbmQgcmV0dXJucyB0aGUgcGFyYW1ldGVyLiAgICBcbiAgICAjIElmIHRoZSBwYXJhbWV0ZXIgaXMgbm90IGEgbm9kZSwgaXQgd2lsbCBqdXN0IGJlIHBhc3NlZCB0aHJvdWdoIHVuYWZmZWN0ZWQuXG4gICAgXG4gICAgYWRkTG9jYXRpb25EYXRhRm4gPSAoZmlyc3QsIGxhc3QpIC0+XG4gICAgICAgIGlmIG5vdCBsYXN0XG4gICAgICAgICAgICBcInl5LmFkZExvY2F0aW9uRGF0YUZuKEAje2ZpcnN0fSlcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcInl5LmFkZExvY2F0aW9uRGF0YUZuKEAje2ZpcnN0fSwgQCN7bGFzdH0pXCJcblxuICAgIGFjdGlvbiA9IGFjdGlvbi5yZXBsYWNlIC9MT0NcXCgoWzAtOV0qKVxcKS9nLCBhZGRMb2NhdGlvbkRhdGFGbignJDEnKVxuICAgIGFjdGlvbiA9IGFjdGlvbi5yZXBsYWNlIC9MT0NcXCgoWzAtOV0qKSxcXHMqKFswLTldKilcXCkvZywgYWRkTG9jYXRpb25EYXRhRm4oJyQxJyAgJyQyJylcblxuICAgIFtwYXR0ZXJuU3RyaW5nLCBcIiQkID0gI3thZGRMb2NhdGlvbkRhdGFGbigxLCBwYXR0ZXJuQ291bnQpfSgje2FjdGlvbn0pO1wiLCBvcHRpb25zXVxuXG4jIEdyYW1tYXRpY2FsIFJ1bGVzXG4jIC0tLS0tLS0tLS0tLS0tLS0tXG4jIEluIGFsbCBvZiB0aGUgcnVsZXMgdGhhdCBmb2xsb3csIHlvdSdsbCBzZWUgdGhlIG5hbWUgb2YgdGhlIG5vbnRlcm1pbmFsIGFzXG4jIHRoZSBrZXkgdG8gYSBsaXN0IG9mIGFsdGVybmF0aXZlIG1hdGNoZXMuIFdpdGggZWFjaCBtYXRjaCdzIGFjdGlvbiwgdGhlXG4jIGRvbGxhci1zaWduIHZhcmlhYmxlcyBhcmUgcHJvdmlkZWQgYnkgSmlzb24gYXMgcmVmZXJlbmNlcyB0byB0aGUgdmFsdWUgb2ZcbiMgdGhlaXIgbnVtZXJpYyBwb3NpdGlvbiwgc28gaW4gdGhpcyBydWxlOlxuI1xuIyAgICAgICAgICAgXCJFeHByZXNzaW9uIFVOTEVTUyBFeHByZXNzaW9uXCJcbiNcbiMgYCQxYCB3b3VsZCBiZSB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGBFeHByZXNzaW9uYCwgYCQyYCB3b3VsZCBiZSB0aGUgdG9rZW5cbiMgZm9yIHRoZSBgVU5MRVNTYCB0ZXJtaW5hbCwgYW5kIGAkM2Agd291bGQgYmUgdGhlIHZhbHVlIG9mIHRoZSBzZWNvbmQgYEV4cHJlc3Npb25gLlxuICAgIFxuZ3JhbW1hciA9XG5cbiAgICAjIFRoZSAqKlJvb3QqKiBpcyB0aGUgdG9wLWxldmVsIG5vZGUgaW4gdGhlIHN5bnRheCB0cmVlLiBTaW5jZSB3ZSBwYXJzZSBib3R0b20tdXAsIGFsbCBwYXJzaW5nIG11c3QgZW5kIGhlcmUuXG4gICAgXG4gICAgUm9vdDogW1xuICAgICAgICBvICcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBCbG9ja1xuICAgICAgICBvICdCb2R5J1xuICAgIF1cblxuICAgICMgQW55IGxpc3Qgb2Ygc3RhdGVtZW50cyBhbmQgZXhwcmVzc2lvbnMsIHNlcGFyYXRlZCBieSBsaW5lIGJyZWFrcyBvciBzZW1pY29sb25zLlxuICAgIFxuICAgIEJvZHk6IFtcbiAgICAgICAgbyAnTGluZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBCbG9jay53cmFwIFskMV1cbiAgICAgICAgbyAnQm9keSBURVJNSU5BVE9SIExpbmUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5wdXNoICQzXG4gICAgICAgIG8gJ0JvZHkgVEVSTUlOQVRPUidcbiAgICBdXG5cbiAgICAjIEJsb2NrIGFuZCBzdGF0ZW1lbnRzLCB3aGljaCBtYWtlIHVwIGEgbGluZSBpbiBhIGJvZHkuIFxuICAgICMgWWllbGRSZXR1cm4gaXMgYSBzdGF0ZW1lbnQsIGJ1dCBub3QgaW5jbHVkZWQgaW4gU3RhdGVtZW50IGJlY2F1c2UgdGhhdCByZXN1bHRzIGluIGFuIGFtYmlndW91cyBncmFtbWFyLlxuICAgIFxuICAgIExpbmU6IFtcbiAgICAgICAgbyAnRXhwcmVzc2lvbidcbiAgICAgICAgbyAnU3RhdGVtZW50J1xuICAgICAgICBvICdZaWVsZFJldHVybidcbiAgICBdXG5cbiAgICAjIFB1cmUgc3RhdGVtZW50cyB3aGljaCBjYW5ub3QgYmUgZXhwcmVzc2lvbnMuXG4gICAgXG4gICAgU3RhdGVtZW50OiBbXG4gICAgICAgIG8gJ1JldHVybidcbiAgICAgICAgbyAnQ29tbWVudCdcbiAgICAgICAgbyAnU1RBVEVNRU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3RhdGVtZW50TGl0ZXJhbCAkMVxuICAgICAgICBvICdJbXBvcnQnXG4gICAgICAgIG8gJ0V4cG9ydCdcbiAgICBdXG5cbiAgICAjIEFsbCB0aGUgZGlmZmVyZW50IHR5cGVzIG9mIGV4cHJlc3Npb25zIGluIG91ciBsYW5ndWFnZS5cbiAgICAjIFRoZSBiYXNpYyB1bml0IG9mIEtvZmZlZSBpcyB0aGUgKipFeHByZXNzaW9uKiogLS0gZXZlcnl0aGluZyB0aGF0IGNhbiBiZSBhbiBleHByZXNzaW9uIGlzIG9uZS4gXG4gICAgIyBCbG9ja3Mgc2VydmUgYXMgdGhlIGJ1aWxkaW5nIGJsb2NrcyBvZiBtYW55IG90aGVyIHJ1bGVzLCBtYWtpbmcgdGhlbSBzb21ld2hhdCBjaXJjdWxhci5cbiAgICBcbiAgICBFeHByZXNzaW9uOiBbXG4gICAgICAgIG8gJ1ZhbHVlJ1xuICAgICAgICBvICdJbnZvY2F0aW9uJ1xuICAgICAgICBvICdDb2RlJ1xuICAgICAgICBvICdPcGVyYXRpb24nXG4gICAgICAgIG8gJ0Fzc2lnbidcbiAgICAgICAgbyAnSWYnXG4gICAgICAgIG8gJ01ldGFJZidcbiAgICAgICAgbyAnVHJ5J1xuICAgICAgICBvICdXaGlsZSdcbiAgICAgICAgbyAnRm9yJ1xuICAgICAgICBvICdTd2l0Y2gnXG4gICAgICAgIG8gJ0NsYXNzJ1xuICAgICAgICBvICdUaHJvdydcbiAgICAgICAgbyAnWWllbGQnXG4gICAgXVxuXG4gICAgWWllbGQ6IFtcbiAgICAgICAgbyAnWUlFTEQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDEsIG5ldyBWYWx1ZSBuZXcgTGl0ZXJhbCAnJ1xuICAgICAgICBvICdZSUVMRCBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMSwgJDJcbiAgICAgICAgbyAnWUlFTEQgRlJPTSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDEuY29uY2F0KCQyKSwgJDNcbiAgICBdXG5cbiAgICAjIEFuIGluZGVudGVkIGJsb2NrIG9mIGV4cHJlc3Npb25zLiBOb3RlIHRoYXQgdGhlIFJld3JpdGVyIHdpbGwgY29udmVydCBzb21lIHBvc3RmaXggZm9ybXMgaW50byBibG9ja3MgZm9yIHVzLCBieSBhZGp1c3RpbmcgdGhlIHRva2VuIHN0cmVhbS5cbiAgICAgICAgXG4gICAgQmxvY2s6IFtcbiAgICAgICAgbyAnSU5ERU5UIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQmxvY2tcbiAgICAgICAgbyAnSU5ERU5UIEJvZHkgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgIF1cblxuICAgIElkZW50aWZpZXI6IFtcbiAgICAgICAgbyAnSURFTlRJRklFUicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSWRlbnRpZmllckxpdGVyYWwgJDFcbiAgICBdXG5cbiAgICBQcm9wZXJ0eTogW1xuICAgICAgICBvICdQUk9QRVJUWScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBQcm9wZXJ0eU5hbWUgJDFcbiAgICBdXG5cbiAgICAjIEFscGhhbnVtZXJpY3MgYXJlIHNlcGFyYXRlZCBmcm9tIHRoZSBvdGhlciAqKkxpdGVyYWwqKiBtYXRjaGVycyBiZWNhdXNlIHRoZXkgY2FuIGFsc28gc2VydmUgYXMga2V5cyBpbiBvYmplY3QgbGl0ZXJhbHMuXG4gICAgXG4gICAgQWxwaGFOdW1lcmljOiBbXG4gICAgICAgIG8gJ05VTUJFUicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE51bWJlckxpdGVyYWwgJDFcbiAgICAgICAgbyAnU3RyaW5nJ1xuICAgIF1cblxuICAgIFN0cmluZzogW1xuICAgICAgICBvICdTVFJJTkcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBTdHJpbmdMaXRlcmFsICQxXG4gICAgICAgIG8gJ1NUUklOR19TVEFSVCBCb2R5IFNUUklOR19FTkQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFN0cmluZ1dpdGhJbnRlcnBvbGF0aW9ucyAkMlxuICAgIF1cblxuICAgIFJlZ2V4OiBbXG4gICAgICAgIG8gJ1JFR0VYJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFJlZ2V4TGl0ZXJhbCAkMVxuICAgICAgICBvICdSRUdFWF9TVEFSVCBJbnZvY2F0aW9uIFJFR0VYX0VORCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBSZWdleFdpdGhJbnRlcnBvbGF0aW9ucyAkMi5hcmdzXG4gICAgXVxuXG4gICAgIyBBbGwgb2Ygb3VyIGltbWVkaWF0ZSB2YWx1ZXMuIEdlbmVyYWxseSB0aGVzZSBjYW4gYmUgcGFzc2VkIHN0cmFpZ2h0IHRocm91Z2ggYW5kIHByaW50ZWQgdG8gSmF2YVNjcmlwdC5cbiAgICBcbiAgICBMaXRlcmFsOiBbXG4gICAgICAgIG8gJ0FscGhhTnVtZXJpYydcbiAgICAgICAgbyAnSlMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUGFzc3Rocm91Z2hMaXRlcmFsICQxXG4gICAgICAgIG8gJ1JlZ2V4J1xuICAgICAgICBvICdVTkRFRklORUQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBVbmRlZmluZWRMaXRlcmFsXG4gICAgICAgIG8gJ05VTEwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE51bGxMaXRlcmFsXG4gICAgICAgIG8gJ0JPT0wnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEJvb2xlYW5MaXRlcmFsICQxXG4gICAgICAgIG8gJ0lORklOSVRZJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEluZmluaXR5TGl0ZXJhbCAkMVxuICAgICAgICBvICdOQU4nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBOYU5MaXRlcmFsXG4gICAgXVxuXG4gICAgIyBBc3NpZ25tZW50IG9mIGEgdmFyaWFibGUsIHByb3BlcnR5LCBvciBpbmRleCB0byBhIHZhbHVlLlxuICAgIFxuICAgIEFzc2lnbjogW1xuICAgICAgICBvICdBc3NpZ25hYmxlID0gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gJDEsICQzXG4gICAgICAgIG8gJ0Fzc2lnbmFibGUgPSBURVJNSU5BVE9SIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFzc2lnbiAkMSwgJDRcbiAgICAgICAgbyAnQXNzaWduYWJsZSA9IElOREVOVCBFeHByZXNzaW9uIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQXNzaWduICQxLCAkNFxuICAgIF1cblxuICAgICMgQXNzaWdubWVudCB3aGVuIGl0IGhhcHBlbnMgd2l0aGluIGFuIG9iamVjdCBsaXRlcmFsLiBUaGUgZGlmZmVyZW5jZSBmcm9tIHRoZSBvcmRpbmFyeSAqKkFzc2lnbioqIGlzIHRoYXQgdGhlc2UgYWxsb3cgbnVtYmVycyBhbmQgc3RyaW5ncyBhcyBrZXlzLlxuICAgIFxuICAgIEFzc2lnbk9iajogW1xuICAgICAgICBvICdPYmpBc3NpZ25hYmxlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBWYWx1ZSAkMVxuICAgICAgICBvICdPYmpBc3NpZ25hYmxlIDogRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gTE9DKDEpKG5ldyBWYWx1ZSAkMSksICQzLCAnb2JqZWN0JyAgb3BlcmF0b3JUb2tlbjogTE9DKDIpKG5ldyBMaXRlcmFsICQyKVxuICAgICAgICBvICdPYmpBc3NpZ25hYmxlIDogSU5ERU5UIEV4cHJlc3Npb24gT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gTE9DKDEpKG5ldyBWYWx1ZSAkMSksICQ0LCAnb2JqZWN0JyAgb3BlcmF0b3JUb2tlbjogTE9DKDIpKG5ldyBMaXRlcmFsICQyKVxuICAgICAgICBvICdTaW1wbGVPYmpBc3NpZ25hYmxlID0gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gTE9DKDEpKG5ldyBWYWx1ZSAkMSksICQzLCBudWxsLCAgICAgb3BlcmF0b3JUb2tlbjogTE9DKDIpKG5ldyBMaXRlcmFsICQyKVxuICAgICAgICBvICdTaW1wbGVPYmpBc3NpZ25hYmxlID0gSU5ERU5UIEV4cHJlc3Npb24gT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gTE9DKDEpKG5ldyBWYWx1ZSAkMSksICQ0LCBudWxsLCAgICAgb3BlcmF0b3JUb2tlbjogTE9DKDIpKG5ldyBMaXRlcmFsICQyKVxuICAgICAgICBvICdDb21tZW50J1xuICAgIF1cblxuICAgIFNpbXBsZU9iakFzc2lnbmFibGU6IFtcbiAgICAgICAgbyAnSWRlbnRpZmllcidcbiAgICAgICAgbyAnUHJvcGVydHknXG4gICAgICAgIG8gJ1RoaXNQcm9wZXJ0eSdcbiAgICBdXG5cbiAgICBPYmpBc3NpZ25hYmxlOiBbXG4gICAgICAgIG8gJ1NpbXBsZU9iakFzc2lnbmFibGUnXG4gICAgICAgIG8gJ0FscGhhTnVtZXJpYydcbiAgICBdXG5cbiAgICAjIEEgcmV0dXJuIHN0YXRlbWVudCBmcm9tIGEgZnVuY3Rpb24gYm9keS5cbiAgICBcbiAgICBSZXR1cm46IFtcbiAgICAgICAgbyAnUkVUVVJOIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUmV0dXJuICQyXG4gICAgICAgIG8gJ1JFVFVSTiBJTkRFTlQgT2JqZWN0IE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFJldHVybiBuZXcgVmFsdWUgJDNcbiAgICAgICAgbyAnUkVUVVJOJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUmV0dXJuXG4gICAgXVxuXG4gICAgWWllbGRSZXR1cm46IFtcbiAgICAgICAgbyAnWUlFTEQgUkVUVVJOIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgWWllbGRSZXR1cm4gJDNcbiAgICAgICAgbyAnWUlFTEQgUkVUVVJOJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgWWllbGRSZXR1cm5cbiAgICBdXG5cbiAgICAjIEEgYmxvY2sgY29tbWVudC5cbiAgICBcbiAgICBDb21tZW50OiBbXG4gICAgICAgIG8gJ0hFUkVDT01NRU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENvbW1lbnQgJDFcbiAgICBdXG5cbiAgICAjIFRoZSBDb2RlIG5vZGUgaXMgdGhlIGZ1bmN0aW9uIGxpdGVyYWwuIEl0J3MgZGVmaW5lZCBieSBhbiBpbmRlbnRlZCBibG9ja1xuICAgICMgb2YgQmxvY2sgcHJlY2VkZWQgYnkgYSBmdW5jdGlvbiBhcnJvdywgd2l0aCBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgbGlzdC5cbiAgICBcbiAgICBDb2RlOiBbXG4gICAgICAgIG8gJ1BBUkFNX1NUQVJUIFBhcmFtTGlzdCBQQVJBTV9FTkQgRnVuY0dseXBoIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENvZGUgJDIsICQ1LCAkNFxuICAgICAgICBvICdGdW5jR2x5cGggQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDb2RlIFtdLCAkMiwgJDFcbiAgICBdXG5cbiAgICAjIEtvZmZlZSBoYXMgdHdvIGRpZmZlcmVudCBzeW1ib2xzIGZvciBmdW5jdGlvbnMuIGAtPmAgaXMgZm9yIG9yZGluYXJ5IGZ1bmN0aW9ucywgYW5kIGA9PmAgaXMgZm9yIGZ1bmN0aW9ucyBib3VuZCB0byB0aGUgY3VycmVudCB2YWx1ZSBvZiAqdGhpcyouXG4gICAgICAgIFxuICAgIEZ1bmNHbHlwaDogW1xuICAgICAgICBvICctPicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICdmdW5jJ1xuICAgICAgICBvICc9PicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICdib3VuZGZ1bmMnXG4gICAgXVxuXG4gICAgT3B0Q29tbWE6IFtcbiAgICAgICAgbyAnJ1xuICAgICAgICBvICcsJ1xuICAgIF1cblxuICAgICMgVGhlIGxpc3Qgb2YgcGFyYW1ldGVycyB0aGF0IGEgZnVuY3Rpb24gYWNjZXB0cyBjYW4gYmUgb2YgYW55IGxlbmd0aC5cbiAgICBcbiAgICBQYXJhbUxpc3Q6IFtcbiAgICAgICAgbyAnJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbXVxuICAgICAgICBvICdQYXJhbScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFskMV1cbiAgICAgICAgbyAnUGFyYW1MaXN0ICwgUGFyYW0nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDNcbiAgICAgICAgbyAnUGFyYW1MaXN0IE9wdENvbW1hIFRFUk1JTkFUT1IgUGFyYW0nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDRcbiAgICAgICAgbyAnUGFyYW1MaXN0IE9wdENvbW1hIElOREVOVCBQYXJhbUxpc3QgT3B0Q29tbWEgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDRcbiAgICBdXG5cbiAgICAjIEEgc2luZ2xlIHBhcmFtZXRlciBpbiBhIGZ1bmN0aW9uIGRlZmluaXRpb24gY2FuIGJlIG9yZGluYXJ5LCBvciBhIHNwbGF0IHRoYXQgaG9vdmVycyB1cCB0aGUgcmVtYWluaW5nIGFyZ3VtZW50cy5cbiAgICBcbiAgICBQYXJhbTogW1xuICAgICAgICBvICdQYXJhbVZhcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBQYXJhbSAkMVxuICAgICAgICBvICdQYXJhbVZhciAuLi4nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBQYXJhbSAkMSwgbnVsbCwgb25cbiAgICAgICAgbyAnUGFyYW1WYXIgPSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUGFyYW0gJDEsICQzXG4gICAgICAgIG8gJy4uLicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cGFuc2lvblxuICAgIF1cblxuICAgICMgRnVuY3Rpb24gUGFyYW1ldGVyc1xuICAgIFxuICAgIFBhcmFtVmFyOiBbXG4gICAgICAgIG8gJ0lkZW50aWZpZXInXG4gICAgICAgIG8gJ1RoaXNQcm9wZXJ0eSdcbiAgICAgICAgbyAnQXJyYXknXG4gICAgICAgIG8gJ09iamVjdCdcbiAgICBdXG5cbiAgICAjIEEgc3BsYXQgdGhhdCBvY2N1cnMgb3V0c2lkZSBvZiBhIHBhcmFtZXRlciBsaXN0LlxuICAgIFxuICAgIFNwbGF0OiBbXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gLi4uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFNwbGF0ICQxXG4gICAgXVxuXG4gICAgIyBWYXJpYWJsZXMgYW5kIHByb3BlcnRpZXMgdGhhdCBjYW4gYmUgYXNzaWduZWQgdG8uXG4gICAgXG4gICAgU2ltcGxlQXNzaWduYWJsZTogW1xuICAgICAgICBvICdJZGVudGlmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBWYWx1ZSAkMVxuICAgICAgICBvICdWYWx1ZSBBY2Nlc3NvcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmFkZCAkMlxuICAgICAgICBvICdJbnZvY2F0aW9uIEFjY2Vzc29yJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBWYWx1ZSAkMSwgW10uY29uY2F0ICQyXG4gICAgICAgIG8gJ1RoaXNQcm9wZXJ0eSdcbiAgICBdXG5cbiAgICAjIEV2ZXJ5dGhpbmcgdGhhdCBjYW4gYmUgYXNzaWduZWQgdG8uXG4gICAgXG4gICAgQXNzaWduYWJsZTogW1xuICAgICAgICBvICdTaW1wbGVBc3NpZ25hYmxlJ1xuICAgICAgICBvICdBcnJheScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBWYWx1ZSAkMVxuICAgICAgICBvICdPYmplY3QnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBWYWx1ZSAkMVxuICAgIF1cblxuICAgICMgVGhlIHR5cGVzIG9mIHRoaW5ncyB0aGF0IGNhbiBiZSB0cmVhdGVkIGFzIHZhbHVlcyAtLSBhc3NpZ25lZCB0bywgaW52b2tlZCBhcyBmdW5jdGlvbnMsIGluZGV4ZWQgaW50bywgbmFtZWQgYXMgYSBjbGFzcywgZXRjLlxuICAgIFxuICAgIFZhbHVlOiBbXG4gICAgICAgIG8gJ0Fzc2lnbmFibGUnXG4gICAgICAgIG8gJ0xpdGVyYWwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ1BhcmVudGhldGljYWwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ1JhbmdlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ1RoaXMnXG4gICAgXVxuXG4gICAgIyBUaGUgZ2VuZXJhbCBncm91cCBvZiBhY2Nlc3NvcnMgaW50byBhbiBvYmplY3QsIGJ5IHByb3BlcnR5LCBieSBwcm90b3R5cGUgb3IgYnkgYXJyYXkgaW5kZXggb3Igc2xpY2UuXG4gICAgXG4gICAgQWNjZXNzb3I6IFtcbiAgICAgICAgbyAnLiAgIFByb3BlcnR5JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQWNjZXNzICQyXG4gICAgICAgIG8gJz8uICBQcm9wZXJ0eScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFjY2VzcyAkMiwgJ3NvYWsnXG4gICAgICAgIG8gJzo6ICBQcm9wZXJ0eScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gW0xPQygxKShuZXcgQWNjZXNzIG5ldyBQcm9wZXJ0eU5hbWUoJ3Byb3RvdHlwZScpKSwgTE9DKDIpKG5ldyBBY2Nlc3MgJDIpXVxuICAgICAgICBvICc/OjogUHJvcGVydHknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFtMT0MoMSkobmV3IEFjY2VzcyBuZXcgUHJvcGVydHlOYW1lKCdwcm90b3R5cGUnKSwgJ3NvYWsnKSwgTE9DKDIpKG5ldyBBY2Nlc3MgJDIpXVxuICAgICAgICBvICc6OicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBY2Nlc3MgbmV3IFByb3BlcnR5TmFtZSAncHJvdG90eXBlJ1xuICAgICAgICBvICdJbmRleCdcbiAgICBdXG5cbiAgICAjIEluZGV4aW5nIGludG8gYW4gb2JqZWN0IG9yIGFycmF5IHVzaW5nIGJyYWNrZXQgbm90YXRpb24uXG4gICAgXG4gICAgSW5kZXg6IFtcbiAgICAgICAgbyAnSU5ERVhfU1RBUlQgSW5kZXhWYWx1ZSBJTkRFWF9FTkQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgICAgICBvICdJTkRFWF9TT0FLICAgIEluZGV4JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IGV4dGVuZCAkMiwgc29hayA6IHllc1xuICAgIF1cblxuICAgIEluZGV4VmFsdWU6IFtcbiAgICAgICAgbyAnRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW5kZXggJDFcbiAgICAgICAgbyAnU2xpY2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU2xpY2UgJDFcbiAgICBdXG5cbiAgICAjIEluIEtvZmZlZSwgYW4gb2JqZWN0IGxpdGVyYWwgaXMgc2ltcGx5IGEgbGlzdCBvZiBhc3NpZ25tZW50cy5cbiAgICBcbiAgICBPYmplY3Q6IFtcbiAgICAgICAgbyAneyBBc3NpZ25MaXN0IE9wdENvbW1hIH0nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT2JqICQyLCAkMS5nZW5lcmF0ZWRcbiAgICBdXG5cbiAgICAjIEFzc2lnbm1lbnQgb2YgcHJvcGVydGllcyB3aXRoaW4gYW4gb2JqZWN0IGxpdGVyYWwgY2FuIGJlIHNlcGFyYXRlZCBieSBjb21tYSwgYXMgaW4gSmF2YVNjcmlwdCwgb3Igc2ltcGx5IGJ5IG5ld2xpbmUuXG4gICAgXG4gICAgQXNzaWduTGlzdDogW1xuICAgICAgICBvICcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFtdXG4gICAgICAgIG8gJ0Fzc2lnbk9iaicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gWyQxXVxuICAgICAgICBvICdBc3NpZ25MaXN0ICwgQXNzaWduT2JqJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkM1xuICAgICAgICBvICdBc3NpZ25MaXN0IE9wdENvbW1hIFRFUk1JTkFUT1IgQXNzaWduT2JqJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgICAgICBvICdBc3NpZ25MaXN0IE9wdENvbW1hIElOREVOVCBBc3NpZ25MaXN0IE9wdENvbW1hIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgIF1cblxuICAgICMgQ2xhc3MgZGVmaW5pdGlvbnMgaGF2ZSBvcHRpb25hbCBib2RpZXMgb2YgcHJvdG90eXBlIHByb3BlcnR5IGFzc2lnbm1lbnRzLCBhbmQgb3B0aW9uYWwgcmVmZXJlbmNlcyB0byB0aGUgc3VwZXJjbGFzcy5cbiAgICBcbiAgICBDbGFzczogW1xuICAgICAgICBvICdDTEFTUycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDbGFzc1xuICAgICAgICBvICdDTEFTUyBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDbGFzcyBudWxsLCBudWxsLCAkMlxuICAgICAgICBvICdDTEFTUyBFWFRFTkRTIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDbGFzcyBudWxsLCAkM1xuICAgICAgICBvICdDTEFTUyBFWFRFTkRTIEV4cHJlc3Npb24gQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDbGFzcyBudWxsLCAkMywgJDRcbiAgICAgICAgbyAnQ0xBU1MgU2ltcGxlQXNzaWduYWJsZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQ2xhc3MgJDJcbiAgICAgICAgbyAnQ0xBU1MgU2ltcGxlQXNzaWduYWJsZSBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQ2xhc3MgJDIsIG51bGwsICQzXG4gICAgICAgIG8gJ0NMQVNTIFNpbXBsZUFzc2lnbmFibGUgRVhURU5EUyBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IENsYXNzICQyLCAkNFxuICAgICAgICBvICdDTEFTUyBTaW1wbGVBc3NpZ25hYmxlIEVYVEVORFMgRXhwcmVzc2lvbiBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDbGFzcyAkMiwgJDQsICQ1XG4gICAgXVxuXG4gICAgSW1wb3J0OiBbXG4gICAgICAgIG8gJ0lNUE9SVCBTdHJpbmcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydERlY2xhcmF0aW9uIG51bGwsICQyXG4gICAgICAgIG8gJ0lNUE9SVCBJbXBvcnREZWZhdWx0U3BlY2lmaWVyIEZST00gU3RyaW5nJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydERlY2xhcmF0aW9uIG5ldyBJbXBvcnRDbGF1c2UoJDIsIG51bGwpLCAkNFxuICAgICAgICBvICdJTVBPUlQgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyIEZST00gU3RyaW5nJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJbXBvcnREZWNsYXJhdGlvbiBuZXcgSW1wb3J0Q2xhdXNlKG51bGwsICQyKSwgJDRcbiAgICAgICAgbyAnSU1QT1JUIHsgfSBGUk9NIFN0cmluZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW1wb3J0RGVjbGFyYXRpb24gbmV3IEltcG9ydENsYXVzZShudWxsLCBuZXcgSW1wb3J0U3BlY2lmaWVyTGlzdCBbXSksICQ1XG4gICAgICAgIG8gJ0lNUE9SVCB7IEltcG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgfSBGUk9NIFN0cmluZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydERlY2xhcmF0aW9uIG5ldyBJbXBvcnRDbGF1c2UobnVsbCwgbmV3IEltcG9ydFNwZWNpZmllckxpc3QgJDMpLCAkN1xuICAgICAgICBvICdJTVBPUlQgSW1wb3J0RGVmYXVsdFNwZWNpZmllciAsIEltcG9ydE5hbWVzcGFjZVNwZWNpZmllciBGUk9NIFN0cmluZycgICAgICAgICAgIC0+IG5ldyBJbXBvcnREZWNsYXJhdGlvbiBuZXcgSW1wb3J0Q2xhdXNlKCQyLCAkNCksICQ2XG4gICAgICAgIG8gJ0lNUE9SVCBJbXBvcnREZWZhdWx0U3BlY2lmaWVyICwgeyBJbXBvcnRTcGVjaWZpZXJMaXN0IE9wdENvbW1hIH0gRlJPTSBTdHJpbmcnICAgLT4gbmV3IEltcG9ydERlY2xhcmF0aW9uIG5ldyBJbXBvcnRDbGF1c2UoJDIsIG5ldyBJbXBvcnRTcGVjaWZpZXJMaXN0ICQ1KSwgJDlcbiAgICBdXG5cbiAgICBJbXBvcnRTcGVjaWZpZXJMaXN0OiBbXG4gICAgICAgIG8gJ0ltcG9ydFNwZWNpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gWyQxXVxuICAgICAgICBvICdJbXBvcnRTcGVjaWZpZXJMaXN0ICwgSW1wb3J0U3BlY2lmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkM1xuICAgICAgICBvICdJbXBvcnRTcGVjaWZpZXJMaXN0IE9wdENvbW1hIFRFUk1JTkFUT1IgSW1wb3J0U3BlY2lmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgICAgICBvICdJTkRFTlQgSW1wb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQyXG4gICAgICAgIG8gJ0ltcG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgSU5ERU5UIEltcG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgT1VUREVOVCcgICAgICAgLT4gJDEuY29uY2F0ICQ0XG4gICAgXVxuXG4gICAgSW1wb3J0U3BlY2lmaWVyOiBbXG4gICAgICAgIG8gJ0lkZW50aWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydFNwZWNpZmllciAkMVxuICAgICAgICBvICdJZGVudGlmaWVyIEFTIElkZW50aWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJbXBvcnRTcGVjaWZpZXIgJDEsICQzXG4gICAgICAgIG8gJ0RFRkFVTFQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEltcG9ydFNwZWNpZmllciBuZXcgTGl0ZXJhbCAkMVxuICAgICAgICBvICdERUZBVUxUIEFTIElkZW50aWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJbXBvcnRTcGVjaWZpZXIgbmV3IExpdGVyYWwoJDEpLCAkM1xuICAgIF1cblxuICAgIEltcG9ydERlZmF1bHRTcGVjaWZpZXI6IFtcbiAgICAgICAgbyAnSWRlbnRpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSW1wb3J0RGVmYXVsdFNwZWNpZmllciAkMVxuICAgIF1cblxuICAgIEltcG9ydE5hbWVzcGFjZVNwZWNpZmllcjogW1xuICAgICAgICBvICdJTVBPUlRfQUxMIEFTIElkZW50aWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIgbmV3IExpdGVyYWwoJDEpLCAkM1xuICAgIF1cblxuICAgIEV4cG9ydDogW1xuICAgICAgICBvICdFWFBPUlQgeyB9JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnROYW1lZERlY2xhcmF0aW9uIG5ldyBFeHBvcnRTcGVjaWZpZXJMaXN0IFtdXG4gICAgICAgIG8gJ0VYUE9SVCB7IEV4cG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgfScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydE5hbWVkRGVjbGFyYXRpb24gbmV3IEV4cG9ydFNwZWNpZmllckxpc3QgJDNcbiAgICAgICAgbyAnRVhQT1JUIENsYXNzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0TmFtZWREZWNsYXJhdGlvbiAkMlxuICAgICAgICBvICdFWFBPUlQgSWRlbnRpZmllciA9IEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnROYW1lZERlY2xhcmF0aW9uIG5ldyBBc3NpZ24gJDIsICQ0LCBudWxsLCBtb2R1bGVEZWNsYXJhdGlvbjogJ2V4cG9ydCdcbiAgICAgICAgbyAnRVhQT1JUIElkZW50aWZpZXIgPSBURVJNSU5BVE9SIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0TmFtZWREZWNsYXJhdGlvbiBuZXcgQXNzaWduICQyLCAkNSwgbnVsbCwgbW9kdWxlRGVjbGFyYXRpb246ICdleHBvcnQnXG4gICAgICAgIG8gJ0VYUE9SVCBJZGVudGlmaWVyID0gSU5ERU5UIEV4cHJlc3Npb24gT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydE5hbWVkRGVjbGFyYXRpb24gbmV3IEFzc2lnbiAkMiwgJDUsIG51bGwsIG1vZHVsZURlY2xhcmF0aW9uOiAnZXhwb3J0J1xuICAgICAgICBvICdFWFBPUlQgREVGQVVMVCBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24gJDNcbiAgICAgICAgbyAnRVhQT1JUIERFRkFVTFQgSU5ERU5UIE9iamVjdCBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uIG5ldyBWYWx1ZSAkNFxuICAgICAgICBvICdFWFBPUlQgRVhQT1JUX0FMTCBGUk9NIFN0cmluZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnRBbGxEZWNsYXJhdGlvbiBuZXcgTGl0ZXJhbCgkMiksICQ0XG4gICAgICAgIG8gJ0VYUE9SVCB7IEV4cG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgfSBGUk9NIFN0cmluZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydE5hbWVkRGVjbGFyYXRpb24gbmV3IEV4cG9ydFNwZWNpZmllckxpc3QoJDMpLCAkN1xuICAgIF1cblxuICAgIEV4cG9ydFNwZWNpZmllckxpc3Q6IFtcbiAgICAgICAgbyAnRXhwb3J0U3BlY2lmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbJDFdXG4gICAgICAgIG8gJ0V4cG9ydFNwZWNpZmllckxpc3QgLCBFeHBvcnRTcGVjaWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQzXG4gICAgICAgIG8gJ0V4cG9ydFNwZWNpZmllckxpc3QgT3B0Q29tbWEgVEVSTUlOQVRPUiBFeHBvcnRTcGVjaWZpZXInICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDEuY29uY2F0ICQ0XG4gICAgICAgIG8gJ0lOREVOVCBFeHBvcnRTcGVjaWZpZXJMaXN0IE9wdENvbW1hIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDJcbiAgICAgICAgbyAnRXhwb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSBJTkRFTlQgRXhwb3J0U3BlY2lmaWVyTGlzdCBPcHRDb21tYSBPVVRERU5UJyAgICAgICAtPiAkMS5jb25jYXQgJDRcbiAgICBdXG5cbiAgICBFeHBvcnRTcGVjaWZpZXI6IFtcbiAgICAgICAgbyAnSWRlbnRpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0U3BlY2lmaWVyICQxXG4gICAgICAgIG8gJ0lkZW50aWZpZXIgQVMgSWRlbnRpZmllcicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4cG9ydFNwZWNpZmllciAkMSwgJDNcbiAgICAgICAgbyAnSWRlbnRpZmllciBBUyBERUZBVUxUJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0U3BlY2lmaWVyICQxLCBuZXcgTGl0ZXJhbCAkM1xuICAgICAgICBvICdERUZBVUxUJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHBvcnRTcGVjaWZpZXIgbmV3IExpdGVyYWwgJDFcbiAgICAgICAgbyAnREVGQVVMVCBBUyBJZGVudGlmaWVyJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwb3J0U3BlY2lmaWVyIG5ldyBMaXRlcmFsKCQxKSwgJDNcbiAgICBdXG5cbiAgICAjIE9yZGluYXJ5IGZ1bmN0aW9uIGludm9jYXRpb24sIG9yIGEgY2hhaW5lZCBzZXJpZXMgb2YgY2FsbHMuXG4gICAgXG4gICAgSW52b2NhdGlvbjogW1xuICAgICAgICBvICdWYWx1ZSBPcHRGdW5jRXhpc3QgU3RyaW5nJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBUYWdnZWRUZW1wbGF0ZUNhbGwgJDEsICQzLCAkMlxuICAgICAgICBvICdWYWx1ZSBPcHRGdW5jRXhpc3QgQXJndW1lbnRzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBDYWxsICQxLCAkMywgJDJcbiAgICAgICAgbyAnSW52b2NhdGlvbiBPcHRGdW5jRXhpc3QgQXJndW1lbnRzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQ2FsbCAkMSwgJDMsICQyXG4gICAgICAgIG8gJ1N1cGVyJ1xuICAgIF1cblxuICAgIFN1cGVyOiBbXG4gICAgICAgIG8gJ1NVUEVSJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFN1cGVyQ2FsbFxuICAgICAgICBvICdTVVBFUiBBcmd1bWVudHMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBTdXBlckNhbGwgJDJcbiAgICBdXG5cbiAgICAjIEFuIG9wdGlvbmFsIGV4aXN0ZW5jZSBjaGVjayBvbiBhIGZ1bmN0aW9uLlxuICAgIFxuICAgIE9wdEZ1bmNFeGlzdDogW1xuICAgICAgICBvICcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5vXG4gICAgICAgIG8gJ0ZVTkNfRVhJU1QnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4geWVzXG4gICAgXVxuXG4gICAgIyBUaGUgbGlzdCBvZiBhcmd1bWVudHMgdG8gYSBmdW5jdGlvbiBjYWxsLlxuICAgIFxuICAgIEFyZ3VtZW50czogW1xuICAgICAgICBvICdDQUxMX1NUQVJUIENBTExfRU5EJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFtdXG4gICAgICAgIG8gJ0NBTExfU1RBUlQgQXJnTGlzdCBPcHRDb21tYSBDQUxMX0VORCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDJcbiAgICBdXG5cbiAgICBUaGlzOiBbXG4gICAgICAgIG8gJ1RISVMnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlIG5ldyBUaGlzTGl0ZXJhbFxuICAgICAgICBvICdAJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBWYWx1ZSBuZXcgVGhpc0xpdGVyYWxcbiAgICBdXG5cbiAgICBUaGlzUHJvcGVydHk6IFtcbiAgICAgICAgbyAnQCBQcm9wZXJ0eScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVmFsdWUgTE9DKDEpKG5ldyBUaGlzTGl0ZXJhbCksIFtMT0MoMikobmV3IEFjY2VzcygkMikpXSwgJ3RoaXMnXG4gICAgXVxuXG4gICAgQXJyYXk6IFtcbiAgICAgICAgbyAnWyBdJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgQXJyIFtdXG4gICAgICAgIG8gJ1sgQXJnTGlzdCBPcHRDb21tYSBdJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEFyciAkMlxuICAgIF1cblxuICAgIFJhbmdlRG90czogW1xuICAgICAgICBvICcuLicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICdpbmNsdXNpdmUnXG4gICAgICAgIG8gJy4uLicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJ2V4Y2x1c2l2ZSdcbiAgICBdXG5cbiAgICBSYW5nZTogW1xuICAgICAgICBvICdbIEV4cHJlc3Npb24gUmFuZ2VEb3RzIEV4cHJlc3Npb24gXScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBSYW5nZSAkMiwgJDQsICQzXG4gICAgXVxuXG4gICAgIyBBcnJheSBzbGljZSBsaXRlcmFscy5cbiAgICBcbiAgICBTbGljZTogW1xuICAgICAgICBvICdFeHByZXNzaW9uIFJhbmdlRG90cyBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBSYW5nZSAkMSwgJDMsICQyXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gUmFuZ2VEb3RzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFJhbmdlICQxLCBudWxsLCAkMlxuICAgICAgICBvICdSYW5nZURvdHMgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBSYW5nZSBudWxsLCAkMiwgJDFcbiAgICAgICAgbyAnUmFuZ2VEb3RzJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUmFuZ2UgbnVsbCwgbnVsbCwgJDFcbiAgICBdXG4gICAgXG4gICAgRm9yU2xpY2U6IFtcbiAgICAgICAgbyAnRXhwcmVzc2lvbiBSYW5nZURvdHMgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgUmFuZ2UgJDEsICQzLCAkMlxuICAgIF1cblxuICAgICMgVGhlICoqQXJnTGlzdCoqIGlzIGJvdGggdGhlIGxpc3Qgb2Ygb2JqZWN0cyBwYXNzZWQgaW50byBhIGZ1bmN0aW9uIGNhbGwsIGFzIHdlbGwgYXMgdGhlIGNvbnRlbnRzIG9mIGFuIGFycmF5IGxpdGVyYWwgKGkuZS4gY29tbWEtc2VwYXJhdGVkIGV4cHJlc3Npb25zKS4gXG4gICAgIyBOZXdsaW5lcyB3b3JrIGFzIHdlbGwuXG4gICAgXG4gICAgQXJnTGlzdDogW1xuICAgICAgICBvICdBcmcnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IFskMV1cbiAgICAgICAgbyAnQXJnTGlzdCAsIEFyZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDNcbiAgICAgICAgbyAnQXJnTGlzdCBPcHRDb21tYSBURVJNSU5BVE9SIEFyZycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5jb25jYXQgJDRcbiAgICAgICAgbyAnSU5ERU5UIEFyZ0xpc3QgT3B0Q29tbWEgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgICAgICBvICdBcmdMaXN0IE9wdENvbW1hIElOREVOVCBBcmdMaXN0IE9wdENvbW1hIE9VVERFTlQnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkNFxuICAgIF1cblxuICAgICMgVmFsaWQgYXJndW1lbnRzIGFyZSBCbG9ja3Mgb3IgU3BsYXRzLlxuICAgIFxuICAgIEFyZzogW1xuICAgICAgICBvICdFeHByZXNzaW9uJ1xuICAgICAgICBvICdTcGxhdCdcbiAgICAgICAgbyAnLi4uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRXhwYW5zaW9uXG4gICAgXVxuXG4gICAgIyBKdXN0IHNpbXBsZSwgY29tbWEtc2VwYXJhdGVkLCByZXF1aXJlZCBhcmd1bWVudHMgKG5vIGZhbmN5IHN5bnRheCkuIFxuICAgICMgV2UgbmVlZCB0aGlzIHRvIGJlIHNlcGFyYXRlIGZyb20gdGhlICoqQXJnTGlzdCoqIGZvciB1c2UgaW4gKipTd2l0Y2gqKiBibG9ja3MsIHdoZXJlIGhhdmluZyB0aGUgbmV3bGluZXMgd291bGRuJ3QgbWFrZSBzZW5zZS5cbiAgICBcbiAgICBTaW1wbGVBcmdzOiBbXG4gICAgICAgIG8gJ0V4cHJlc3Npb24nXG4gICAgICAgIG8gJ1NpbXBsZUFyZ3MgLCBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gW10uY29uY2F0ICQxLCAkM1xuICAgIF1cblxuICAgICMgVGhlIHZhcmlhbnRzIG9mICp0cnkvY2F0Y2gvZmluYWxseSogZXhjZXB0aW9uIGhhbmRsaW5nIGJsb2Nrcy5cbiAgICBcbiAgICBUcnk6IFtcbiAgICAgICAgbyAnVFJZIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVHJ5ICQyXG4gICAgICAgIG8gJ1RSWSBCbG9jayBDYXRjaCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFRyeSAkMiwgJDNbMF0sICQzWzFdXG4gICAgICAgIG8gJ1RSWSBCbG9jayBGSU5BTExZIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFRyeSAkMiwgbnVsbCwgbnVsbCwgJDRcbiAgICAgICAgbyAnVFJZIEJsb2NrIENhdGNoIEZJTkFMTFkgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVHJ5ICQyLCAkM1swXSwgJDNbMV0sICQ1XG4gICAgXVxuXG4gICAgIyBBIGNhdGNoIGNsYXVzZSBuYW1lcyBpdHMgZXJyb3IgYW5kIHJ1bnMgYSBibG9jayBvZiBjb2RlLlxuICAgIFxuICAgIENhdGNoOiBbXG4gICAgICAgIG8gJ0NBVENIIElkZW50aWZpZXIgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gWyQyLCAkM11cbiAgICAgICAgbyAnQ0FUQ0ggT2JqZWN0IEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbTE9DKDIpKG5ldyBWYWx1ZSgkMikpLCAkM11cbiAgICAgICAgbyAnQ0FUQ0ggQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbbnVsbCwgJDJdXG4gICAgXVxuXG4gICAgVGhyb3c6IFtcbiAgICAgICAgbyAnVEhST1cgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgVGhyb3cgJDJcbiAgICBdXG5cbiAgICAjIFBhcmVudGhldGljYWwgZXhwcmVzc2lvbnMuIFxuICAgICMgTm90ZSB0aGF0IHRoZSAqKlBhcmVudGhldGljYWwqKiBpcyBhICoqVmFsdWUqKiwgbm90IGFuICoqRXhwcmVzc2lvbioqLCBzbyBpZiB5b3UgbmVlZCB0byB1c2UgYW4gZXhwcmVzc2lvbiBpbiBhIHBsYWNlXG4gICAgIyB3aGVyZSBvbmx5IHZhbHVlcyBhcmUgYWNjZXB0ZWQsIHdyYXBwaW5nIGl0IGluIHBhcmVudGhlc2VzIHdpbGwgYWx3YXlzIGRvIHRoZSB0cmljay5cbiAgICBcbiAgICBQYXJlbnRoZXRpY2FsOiBbXG4gICAgICAgIG8gJyggQm9keSApJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFBhcmVucyAkMlxuICAgICAgICBvICcoIElOREVOVCBCb2R5IE9VVERFTlQgKScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBQYXJlbnMgJDNcbiAgICBdXG5cbiAgICAjIFRoZSBjb25kaXRpb24gcG9ydGlvbiBvZiBhIHdoaWxlIGxvb3AuXG4gICAgICAgIFxuICAgIFdoaWxlU291cmNlOiBbXG4gICAgICAgIG8gJ1dISUxFIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFdoaWxlICQyXG4gICAgICAgIG8gJ1dISUxFIEV4cHJlc3Npb24gV0hFTiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFdoaWxlICQyLCBndWFyZDogJDRcbiAgICAgICAgbyAnVU5USUwgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgV2hpbGUgJDIsIGludmVydDogdHJ1ZVxuICAgICAgICBvICdVTlRJTCBFeHByZXNzaW9uIFdIRU4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBXaGlsZSAkMiwgaW52ZXJ0OiB0cnVlLCBndWFyZDogJDRcbiAgICBdXG5cbiAgICAjIFRoZSB3aGlsZSBsb29wIGNhbiBlaXRoZXIgYmUgbm9ybWFsLCB3aXRoIGEgYmxvY2sgb2YgZXhwcmVzc2lvbnMgdG8gZXhlY3V0ZSwgb3IgcG9zdGZpeCwgd2l0aCBhIHNpbmdsZSBleHByZXNzaW9uLiBcbiAgICAjIFRoZXJlIGlzIG5vIGRvLi53aGlsZS5cbiAgICBcbiAgICBXaGlsZTogW1xuICAgICAgICBvICdXaGlsZVNvdXJjZSBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmFkZEJvZHkgJDJcbiAgICAgICAgbyAnU3RhdGVtZW50ICAgIFdoaWxlU291cmNlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMi5hZGRCb2R5IExPQygxKSBCbG9jay53cmFwKFskMV0pXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gV2hpbGVTb3VyY2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gJDIuYWRkQm9keSBMT0MoMSkgQmxvY2sud3JhcChbJDFdKVxuICAgICAgICBvICdMb29wJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxXG4gICAgXVxuXG4gICAgTG9vcDogW1xuICAgICAgICBvICdMT09QIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBXaGlsZShMT0MoMSkgbmV3IEJvb2xlYW5MaXRlcmFsICd0cnVlJykuYWRkQm9keSAkMlxuICAgICAgICBvICdMT09QIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBXaGlsZShMT0MoMSkgbmV3IEJvb2xlYW5MaXRlcmFsICd0cnVlJykuYWRkQm9keSBMT0MoMikgQmxvY2sud3JhcCBbJDJdXG4gICAgXVxuXG4gICAgIyBBcnJheSwgb2JqZWN0LCBhbmQgcmFuZ2UgY29tcHJlaGVuc2lvbnMsIGF0IHRoZSBtb3N0IGdlbmVyaWMgbGV2ZWwuXG4gICAgIyBDb21wcmVoZW5zaW9ucyBjYW4gZWl0aGVyIGJlIG5vcm1hbCwgd2l0aCBhIGJsb2NrIG9mIGV4cHJlc3Npb25zIHRvIGV4ZWN1dGUsIG9yIHBvc3RmaXgsIHdpdGggYSBzaW5nbGUgZXhwcmVzc2lvbi5cbiAgICBcbiAgICBGb3I6IFtcbiAgICAgICAgbyAnU3RhdGVtZW50IEZvckJvZHknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgRm9yICQxLCAkMlxuICAgICAgICBvICdFeHByZXNzaW9uIEZvckJvZHknICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBGb3IgJDEsICQyXG4gICAgICAgIG8gJ0ZvckJvZHkgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEZvciAkMiwgJDFcbiAgICBdXG5cbiAgICBGb3JCb2R5OiBbXG4gICAgICAgIG8gJ0ZPUiBSYW5nZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAoTE9DKDIpIG5ldyBWYWx1ZSgkMikpXG4gICAgICAgIG8gJ0ZPUiBSYW5nZSBCWSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAoTE9DKDIpIG5ldyBWYWx1ZSgkMikpLCBzdGVwOiAkNFxuICAgICAgICBvICdGb3JTdGFydCBGb3JTb3VyY2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQyLm93biA9ICQxLm93bjsgJDIub3duVGFnID0gJDEub3duVGFnOyAkMi5uYW1lID0gJDFbMF07ICQyLmluZGV4ID0gJDFbMV07ICQyXG4gICAgXVxuXG4gICAgRm9yU3RhcnQ6IFtcbiAgICAgICAgbyAnRk9SIEZvclZhcmlhYmxlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMlxuICAgICAgICBvICdGT1IgT1dOIEZvclZhcmlhYmxlcycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQzLm93biA9IHllczsgJDMub3duVGFnID0gKExPQygyKSBuZXcgTGl0ZXJhbCgkMikpOyAkM1xuICAgIF1cblxuICAgICMgQW4gYXJyYXkgb2YgYWxsIGFjY2VwdGVkIHZhbHVlcyBmb3IgYSB2YXJpYWJsZSBpbnNpZGUgdGhlIGxvb3AuIFRoaXMgZW5hYmxlcyBzdXBwb3J0IGZvciBwYXR0ZXJuIG1hdGNoaW5nLlxuICAgICAgICBcbiAgICBGb3JWYWx1ZTogW1xuICAgICAgICBvICdJZGVudGlmaWVyJ1xuICAgICAgICBvICdUaGlzUHJvcGVydHknXG4gICAgICAgIG8gJ0FycmF5JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgICAgIG8gJ09iamVjdCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFZhbHVlICQxXG4gICAgXVxuXG4gICAgIyBBbiBhcnJheSBvciByYW5nZSBjb21wcmVoZW5zaW9uIGhhcyB2YXJpYWJsZXMgZm9yIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIChvcHRpb25hbCkgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IGluZGV4LiBcbiAgICAjIE9yLCAqa2V5LCB2YWx1ZSosIGluIHRoZSBjYXNlIG9mIG9iamVjdCBjb21wcmVoZW5zaW9ucy5cbiAgICBcbiAgICBGb3JWYXJpYWJsZXM6IFtcbiAgICAgICAgbyAnRm9yVmFsdWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbJDFdXG4gICAgICAgIG8gJ0ZvclZhbHVlICwgRm9yVmFsdWUnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gWyQxLCAkM11cbiAgICBdXG5cbiAgICAjIFRoZSBzb3VyY2Ugb2YgYSBjb21wcmVoZW5zaW9uIGlzIGFuIGFycmF5IG9yIG9iamVjdCB3aXRoIGFuIG9wdGlvbmFsIGd1YXJkIGNsYXVzZS5cbiAgICAjIElmIGl0J3MgYW4gYXJyYXkgY29tcHJlaGVuc2lvbiwgeW91IGNhbiBhbHNvIGNob29zZSB0byBzdGVwIHRocm91Z2ggaW4gZml4ZWQtc2l6ZSBpbmNyZW1lbnRzLlxuICAgIFxuICAgIEZvclNvdXJjZTogW1xuICAgICAgICBvICdGT1JJTiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IHNvdXJjZTogJDJcbiAgICAgICAgbyAnRk9ST0YgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBvYmplY3Q6IHllc1xuICAgICAgICBvICdGT1JJTiBFeHByZXNzaW9uIFdIRU4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IHNvdXJjZTogJDIsIGd1YXJkOiAkNFxuICAgICAgICBvICdGT1JPRiBFeHByZXNzaW9uIFdIRU4gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IHNvdXJjZTogJDIsIGd1YXJkOiAkNCwgb2JqZWN0OiB5ZXNcbiAgICAgICAgbyAnRk9SSU4gRXhwcmVzc2lvbiBCWSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBzdGVwOiAgJDRcbiAgICAgICAgbyAnRk9SSU4gRXhwcmVzc2lvbiBXSEVOIEV4cHJlc3Npb24gQlkgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBndWFyZDogJDQsIHN0ZXA6ICQ2XG4gICAgICAgIG8gJ0ZPUklOIEV4cHJlc3Npb24gQlkgRXhwcmVzc2lvbiBXSEVOIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAkMiwgc3RlcDogICQ0LCBndWFyZDogJDZcbiAgICAgICAgbyAnRk9SRlJPTSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyLCBmcm9tOiAgeWVzXG4gICAgICAgIG8gJ0ZPUkZST00gRXhwcmVzc2lvbiBXSEVOIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc291cmNlOiAkMiwgZ3VhcmQ6ICQ0LCBmcm9tOiB5ZXNcbiAgICAgICAgbyAnRk9SSU4gRm9yU2xpY2UnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzb3VyY2U6ICQyXG4gICAgXVxuXG4gICAgU3dpdGNoOiBbXG4gICAgICAgIG8gJ1NXSVRDSCBFeHByZXNzaW9uIElOREVOVCBXaGVucyBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFN3aXRjaCAkMiwgJDRcbiAgICAgICAgbyAnU1dJVENIIEV4cHJlc3Npb24gSU5ERU5UIFdoZW5zIEVMU0UgQmxvY2sgT1VUREVOVCcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3dpdGNoICQyLCAkNCwgJDZcbiAgICAgICAgbyAnU1dJVENIIElOREVOVCBXaGVucyBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgU3dpdGNoIG51bGwsICQzXG4gICAgICAgIG8gJ1NXSVRDSCBJTkRFTlQgV2hlbnMgRUxTRSBCbG9jayBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IFN3aXRjaCBudWxsLCAkMywgJDVcbiAgICBdXG5cbiAgICBXaGVuczogW1xuICAgICAgICBvICdXaGVuJ1xuICAgICAgICBvICdXaGVucyBXaGVuJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmNvbmNhdCAkMlxuICAgIF1cblxuICAgICMgQW4gaW5kaXZpZHVhbCAqKldoZW4qKiBjbGF1c2UsIHdpdGggYWN0aW9uLlxuICAgIFxuICAgIFdoZW46IFtcbiAgICAgICAgbyAnTEVBRElOR19XSEVOIFNpbXBsZUFyZ3MgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBbWyQyLCAkM11dXG4gICAgICAgIG8gJ0xFQURJTkdfV0hFTiBTaW1wbGVBcmdzIEJsb2NrIFRFUk1JTkFUT1InICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gW1skMiwgJDNdXVxuICAgIF1cblxuICAgICMgVGhlIG1vc3QgYmFzaWMgZm9ybSBvZiAqaWYqIGlzIGEgY29uZGl0aW9uIGFuZCBhbiBhY3Rpb24uIFxuICAgICMgVGhlIGZvbGxvd2luZyBpZi1yZWxhdGVkIHJ1bGVzIGFyZSBicm9rZW4gdXAgYWxvbmcgdGhlc2UgbGluZXMgaW4gb3JkZXIgdG8gYXZvaWQgYW1iaWd1aXR5LlxuXG4gICAgTWV0YUlmQmxvY2s6IFtcbiAgICAgICAgbyAnTUVUQV9JRiBFeHByZXNzaW9uIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgTWV0YUlmICQyLCAkMywgdHlwZTogJDFcbiAgICAgICAgbyAnTWV0YUlmQmxvY2sgTUVUQV9FTFNFIE1FVEFfSUYgRXhwcmVzc2lvbiBCbG9jaycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5hZGRFbHNlIExPQygzLDUpIG5ldyBNZXRhSWYgJDQsICQ1LCB0eXBlOiAkM1xuICAgIF1cblxuICAgIE1ldGFJZjogW1xuICAgICAgICBvICdNZXRhSWZCbG9jaydcbiAgICAgICAgbyAnTWV0YUlmQmxvY2sgTUVUQV9FTFNFIEJsb2NrJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5hZGRFbHNlICQzXG4gICAgICAgIG8gJ1N0YXRlbWVudCBQT1NUX01FVEFfSUYgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE1ldGFJZiAkMywgTE9DKDEpKEJsb2NrLndyYXAgWyQxXSksIHR5cGU6ICQyLCBzdGF0ZW1lbnQ6IHRydWVcbiAgICAgICAgbyAnRXhwcmVzc2lvbiBQT1NUX01FVEFfSUYgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgTWV0YUlmICQzLCBMT0MoMSkoQmxvY2sud3JhcCBbJDFdKSwgdHlwZTogJDIsIHN0YXRlbWVudDogdHJ1ZVxuICAgIF1cbiAgICBcbiAgICBJZkJsb2NrOiBbXG4gICAgICAgIG8gJ0lGIEV4cHJlc3Npb24gQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IElmICQyLCAkMywgdHlwZTogJDFcbiAgICAgICAgbyAnSWZCbG9jayBFTFNFIElGIEV4cHJlc3Npb24gQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiAkMS5hZGRFbHNlIExPQygzLDUpIG5ldyBJZiAkNCwgJDUsIHR5cGU6ICQzXG4gICAgXVxuXG4gICAgIyBUaGUgZnVsbCBjb21wbGVtZW50IG9mICppZiogZXhwcmVzc2lvbnMsIGluY2x1ZGluZyBwb3N0Zml4IG9uZS1saW5lciAqaWYqIGFuZCAqdW5sZXNzKi5cbiAgICBcbiAgICBJZjogW1xuICAgICAgICBvICdJZkJsb2NrJ1xuICAgICAgICBvICdJZkJsb2NrIEVMU0UgQmxvY2snICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+ICQxLmFkZEVsc2UgJDNcbiAgICAgICAgbyAnU3RhdGVtZW50IFBPU1RfSUYgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgSWYgJDMsIExPQygxKShCbG9jay53cmFwIFskMV0pLCB0eXBlOiAkMiwgc3RhdGVtZW50OiB0cnVlXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gUE9TVF9JRiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IElmICQzLCBMT0MoMSkoQmxvY2sud3JhcCBbJDFdKSwgdHlwZTogJDIsIHN0YXRlbWVudDogdHJ1ZVxuICAgIF1cblxuICAgICMgQXJpdGhtZXRpYyBhbmQgbG9naWNhbCBvcGVyYXRvcnMsIHdvcmtpbmcgb24gb25lIG9yIG1vcmUgb3BlcmFuZHMuXG4gICAgIyBIZXJlIHRoZXkgYXJlIGdyb3VwZWQgYnkgb3JkZXIgb2YgcHJlY2VkZW5jZS4gVGhlIGFjdHVhbCBwcmVjZWRlbmNlIHJ1bGVzIGFyZSBkZWZpbmVkIGF0IHRoZSBib3R0b20gb2YgdGhlIHBhZ2UuIFxuICAgICMgSXQgd291bGQgYmUgc2hvcnRlciBpZiB3ZSBjb3VsZCBjb21iaW5lIG1vc3Qgb2YgdGhlc2UgcnVsZXMgaW50byBhIHNpbmdsZSBnZW5lcmljICpPcGVyYW5kIE9wU3ltYm9sIE9wZXJhbmQqLXR5cGUgcnVsZSwgXG4gICAgIyBidXQgaW4gb3JkZXIgdG8gbWFrZSB0aGUgcHJlY2VkZW5jZSBiaW5kaW5nIHBvc3NpYmxlLCBzZXBhcmF0ZSBydWxlcyBhcmUgbmVjZXNzYXJ5LlxuICAgIFxuICAgIE9wZXJhdGlvbjogW1xuICAgICAgICBvICdVTkFSWSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMSAsICQyXG4gICAgICAgIG8gJ1VOQVJZX01BVEggRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQxICwgJDJcbiAgICAgICAgbyAnLSBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgtPiBuZXcgT3AgJy0nICAkMiksIHByZWM6ICdVTkFSWV9NQVRIJ1xuICAgICAgICBvICcrIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKC0+IG5ldyBPcCAnKycgICQyKSwgcHJlYzogJ1VOQVJZX01BVEgnXG5cbiAgICAgICAgbyAnLS0gU2ltcGxlQXNzaWduYWJsZScgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJy0tJyAkMlxuICAgICAgICBvICcrKyBTaW1wbGVBc3NpZ25hYmxlJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAnKysnICQyXG4gICAgICAgIG8gJ1NpbXBsZUFzc2lnbmFibGUgLS0nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICctLScgJDEsIG51bGwsIHRydWVcbiAgICAgICAgbyAnU2ltcGxlQXNzaWduYWJsZSArKycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJysrJyAkMSwgbnVsbCwgdHJ1ZVxuXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gPycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IEV4aXN0ZW5jZSAkMVxuXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gKyBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICcrJyAsICQxLCAkM1xuICAgICAgICBvICdFeHByZXNzaW9uIC0gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAnLScgLCAkMSwgJDNcblxuICAgICAgICBvICdFeHByZXNzaW9uIE1BVEggICAgIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMiwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gKiogICAgICAgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQyLCAkMSwgJDNcbiAgICAgICAgbyAnRXhwcmVzc2lvbiBTSElGVCAgICBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDIsICQxLCAkM1xuICAgICAgICBvICdFeHByZXNzaW9uIENPTVBBUkUgIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMiwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gJiAgICAgICAgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQyLCAkMSwgJDNcbiAgICAgICAgbyAnRXhwcmVzc2lvbiBeICAgICAgICBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDIsICQxLCAkM1xuICAgICAgICBvICdFeHByZXNzaW9uIHwgICAgICAgIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMiwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gJiYgICAgICAgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gbmV3IE9wICQyLCAkMSwgJDNcbiAgICAgICAgbyAnRXhwcmVzc2lvbiB8fCAgICAgICBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBuZXcgT3AgJDIsICQxLCAkM1xuICAgICAgICBvICdFeHByZXNzaW9uIEJJTj8gICAgIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBPcCAkMiwgJDEsICQzXG4gICAgICAgIG8gJ0V4cHJlc3Npb24gUkVMQVRJT04gRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gaWYgJDIuY2hhckF0KDApIGlzICchJyB0aGVuIG5ldyBPcCgkMlsxLi5dLCAkMSwgJDMpLmludmVydCgpIGVsc2UgbmV3IE9wICQyLCAkMSwgJDNcblxuICAgICAgICBvICdTaW1wbGVBc3NpZ25hYmxlIENPTVBPVU5EX0FTU0lHTiBFeHByZXNzaW9uJyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gJDEsICQzLCAkMlxuICAgICAgICBvICdTaW1wbGVBc3NpZ25hYmxlIENPTVBPVU5EX0FTU0lHTiBJTkRFTlQgRXhwcmVzc2lvbiBPVVRERU5UJyAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gJDEsICQ0LCAkMlxuICAgICAgICBvICdTaW1wbGVBc3NpZ25hYmxlIENPTVBPVU5EX0FTU0lHTiBURVJNSU5BVE9SIEV4cHJlc3Npb24nICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBBc3NpZ24gJDEsICQ0LCAkMlxuICAgICAgICBvICdTaW1wbGVBc3NpZ25hYmxlIEVYVEVORFMgRXhwcmVzc2lvbicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IG5ldyBFeHRlbmRzICQxLCAkM1xuICAgIF1cblxuXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG4jIE9wZXJhdG9ycyBhdCB0aGUgdG9wIG9mIHRoaXMgbGlzdCBoYXZlIGhpZ2hlciBwcmVjZWRlbmNlIHRoYW4gdGhlIG9uZXMgbG93ZXIgZG93bi5cbiMgRm9sbG93aW5nIHRoZXNlIHJ1bGVzIGlzIHdoYXQgbWFrZXMgYDIgKyAzICogNGAgcGFyc2UgYXM6IGAyICsgKDMgKiA0KWAgYW5kIG5vdCBgKDIgKyAzKSAqIDRgXG5cbm9wZXJhdG9ycyA9IFtcbiAgICBbJ2xlZnQnICAgICAnLicgJz8uJyAnOjonICc/OjonXVxuICAgIFsnbGVmdCcgICAgICdDQUxMX1NUQVJUJyAnQ0FMTF9FTkQnXVxuICAgIFsnbm9uYXNzb2MnICcrKycgJy0tJ11cbiAgICBbJ2xlZnQnICAgICAnPyddXG4gICAgWydyaWdodCcgICAgJ1VOQVJZJ11cbiAgICBbJ3JpZ2h0JyAgICAnKionXVxuICAgIFsncmlnaHQnICAgICdVTkFSWV9NQVRIJ11cbiAgICBbJ2xlZnQnICAgICAnTUFUSCddXG4gICAgWydsZWZ0JyAgICAgJysnICctJ11cbiAgICBbJ2xlZnQnICAgICAnU0hJRlQnXVxuICAgIFsnbGVmdCcgICAgICdSRUxBVElPTiddXG4gICAgWydsZWZ0JyAgICAgJ0NPTVBBUkUnXVxuICAgIFsnbGVmdCcgICAgICcmJ11cbiAgICBbJ2xlZnQnICAgICAnXiddXG4gICAgWydsZWZ0JyAgICAgJ3wnXVxuICAgIFsnbGVmdCcgICAgICcmJiddXG4gICAgWydsZWZ0JyAgICAgJ3x8J11cbiAgICBbJ2xlZnQnICAgICAnQklOPyddXG4gICAgWydub25hc3NvYycgJ0lOREVOVCcgJ09VVERFTlQnXVxuICAgIFsncmlnaHQnICAgICdZSUVMRCddXG4gICAgWydyaWdodCcgICAgJz0nICc6JyAnQ09NUE9VTkRfQVNTSUdOJyAnUkVUVVJOJyAnVEhST1cnICdFWFRFTkRTJ11cbiAgICBbJ3JpZ2h0JyAgICAnRk9SSU4nICdGT1JPRicgJ0ZPUkZST00nICdCWScgJ1dIRU4nXVxuICAgIFsncmlnaHQnICAgICdJRicgJ01FVEFfSUYnICdFTFNFJyAnTUVUQV9FTFNFJyAnRk9SJyAnV0hJTEUnICdVTlRJTCcgJ0xPT1AnICdTVVBFUicgJ0NMQVNTJyAnSU1QT1JUJyAnRVhQT1JUJ11cbiAgICBbJ2xlZnQnICAgICAnUE9TVF9JRicgJ1BPU1RfTUVUQV9JRiddXG5dXG5cbiMgV3JhcHBpbmcgVXBcbiMgLS0tLS0tLS0tLS1cbiMgRmluYWxseSwgbm93IHRoYXQgd2UgaGF2ZSBvdXIgZ3JhbW1hciBhbmQgb3VyIG9wZXJhdG9ycywgd2UgY2FuIGNyZWF0ZSBvdXIgSmlzb24uUGFyc2VyLiBcbiMgV2UgZG8gdGhpcyBieSBwcm9jZXNzaW5nIGFsbCBvZiBvdXIgcnVsZXMsIHJlY29yZGluZyBhbGwgdGVybWluYWxzIChldmVyeSBzeW1ib2wgd2hpY2ggZG9lcyBub3QgYXBwZWFyIGFzIHRoZSBuYW1lIG9mIGEgcnVsZSBhYm92ZSkgYXMgXCJ0b2tlbnNcIi5cblxudG9rZW5zID0gW11cbmZvciBuYW1lLCBhbHRlcm5hdGl2ZXMgb2YgZ3JhbW1hclxuICAgIGdyYW1tYXJbbmFtZV0gPSBmb3IgYWx0IGluIGFsdGVybmF0aXZlc1xuICAgICAgICBmb3IgdG9rZW4gaW4gYWx0WzBdLnNwbGl0ICcgJ1xuICAgICAgICAgICAgdG9rZW5zLnB1c2ggdG9rZW4gdW5sZXNzIGdyYW1tYXJbdG9rZW5dXG4gICAgICAgIGFsdFsxXSA9IFwicmV0dXJuICN7YWx0WzFdfVwiIGlmIG5hbWUgaXMgJ1Jvb3QnXG4gICAgICAgIGFsdFxuXG4jIEluaXRpYWxpemUgdGhlIFBhcnNlciB3aXRoIG91ciBsaXN0IG9mIHRlcm1pbmFsIHRva2Vucywgb3VyIGdyYW1tYXIgcnVsZXMsIGFuZCB0aGUgbmFtZSBvZiB0aGUgcm9vdC4gXG4jIFJldmVyc2UgdGhlIG9wZXJhdG9ycyBiZWNhdXNlIEppc29uIG9yZGVycyBwcmVjZWRlbmNlIGZyb20gbG93IHRvIGhpZ2gsIGFuZCB3ZSBoYXZlIGl0IGhpZ2ggdG8gbG93IChhcyBpbiBbWWFjY10oaHR0cDovL2Rpbm9zYXVyLmNvbXBpbGVydG9vbHMubmV0L3lhY2MvaW5kZXguaHRtbCkpLlxuXG5leHBvcnRzLnBhcnNlciA9IG5ldyBQYXJzZXJcbiAgICBibmY6ICAgICAgICAgZ3JhbW1hclxuICAgIHRva2VuczogICAgICB0b2tlbnMuam9pbiAnICdcbiAgICBvcGVyYXRvcnM6ICAgb3BlcmF0b3JzLnJldmVyc2UoKVxuICAgIHN0YXJ0U3ltYm9sOiAnUm9vdCdcbiJdfQ==
//# sourceURL=../coffee/grammar.coffee