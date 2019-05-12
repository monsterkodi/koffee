// koffee 0.35.0

/*
 0000000   00000000    0000000   00     00  00     00   0000000   00000000   
000        000   000  000   000  000   000  000   000  000   000  000   000  
000  0000  0000000    000000000  000000000  000000000  000000000  0000000    
000   000  000   000  000   000  000 0 000  000 0 000  000   000  000   000  
 0000000   000   000  000   000  000   000  000   000  000   000  000   000
 */

(function() {
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

}).call(this);
