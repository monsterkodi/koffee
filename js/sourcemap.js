// koffee 0.29.0
(function() {
    var LineMap, SourceMap;

    LineMap = (function() {
        function LineMap(line1) {
            this.line = line1;
            this.columns = [];
        }

        LineMap.prototype.add = function(column, arg, options) {
            var sourceColumn, sourceLine;
            sourceLine = arg[0], sourceColumn = arg[1];
            if (options == null) {
                options = {};
            }
            if (this.columns[column] && options.noReplace) {
                return;
            }
            return this.columns[column] = {
                line: this.line,
                column: column,
                sourceLine: sourceLine,
                sourceColumn: sourceColumn
            };
        };

        LineMap.prototype.sourceLocation = function(column) {
            var mapping;
            while (!((mapping = this.columns[column]) || (column <= 0))) {
                column--;
            }
            return mapping && [mapping.sourceLine, mapping.sourceColumn];
        };

        return LineMap;

    })();


    /*
     0000000   0000000   000   000  00000000    0000000  00000000  00     00   0000000   00000000   
    000       000   000  000   000  000   000  000       000       000   000  000   000  000   000  
    0000000   000   000  000   000  0000000    000       0000000   000000000  000000000  00000000   
         000  000   000  000   000  000   000  000       000       000 0 000  000   000  000        
    0000000    0000000    0000000   000   000   0000000  00000000  000   000  000   000  000
     */

    SourceMap = (function() {
        var BASE64_CHARS, VLQ_CONTINUATION_BIT, VLQ_SHIFT, VLQ_VALUE_MASK;

        function SourceMap() {
            this.lines = [];
        }

        SourceMap.prototype.add = function(sourceLocation, generatedLocation, options) {
            var base, column, line, lineMap;
            if (options == null) {
                options = {};
            }
            line = generatedLocation[0], column = generatedLocation[1];
            lineMap = ((base = this.lines)[line] || (base[line] = new LineMap(line)));
            return lineMap.add(column, sourceLocation, options);
        };

        SourceMap.prototype.sourceLocation = function(arg) {
            var column, line, lineMap;
            line = arg[0], column = arg[1];
            while (!((lineMap = this.lines[line]) || (line <= 0))) {
                line--;
            }
            return lineMap && lineMap.sourceLocation(column);
        };

        SourceMap.prototype.generate = function(options, code) {
            var buffer, i, j, lastColumn, lastSourceColumn, lastSourceLine, len, len1, lineMap, lineNumber, mapping, needComma, ref, ref1, v3, writingline;
            if (options == null) {
                options = {};
            }
            if (code == null) {
                code = null;
            }
            writingline = 0;
            lastColumn = 0;
            lastSourceLine = 0;
            lastSourceColumn = 0;
            needComma = false;
            buffer = "";
            ref = this.lines;
            for (lineNumber = i = 0, len = ref.length; i < len; lineNumber = ++i) {
                lineMap = ref[lineNumber];
                if (lineMap) {
                    ref1 = lineMap.columns;
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                        mapping = ref1[j];
                        if (!(mapping)) {
                            continue;
                        }
                        while (writingline < mapping.line) {
                            lastColumn = 0;
                            needComma = false;
                            buffer += ";";
                            writingline++;
                        }
                        if (needComma) {
                            buffer += ",";
                            needComma = false;
                        }
                        buffer += this.encodeVlq(mapping.column - lastColumn);
                        lastColumn = mapping.column;
                        buffer += this.encodeVlq(0);
                        buffer += this.encodeVlq(mapping.sourceLine - lastSourceLine);
                        lastSourceLine = mapping.sourceLine;
                        buffer += this.encodeVlq(mapping.sourceColumn - lastSourceColumn);
                        lastSourceColumn = mapping.sourceColumn;
                        needComma = true;
                    }
                }
            }
            v3 = {
                version: 3,
                file: options.generatedFile || '',
                sourceRoot: options.sourceRoot || '',
                sources: options.sourceFiles || [''],
                names: [],
                mappings: buffer
            };
            if (options.inlineMap) {
                v3.sourcesContent = [code];
            }
            return v3;
        };

        VLQ_SHIFT = 5;

        VLQ_CONTINUATION_BIT = 1 << VLQ_SHIFT;

        VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT - 1;

        SourceMap.prototype.encodeVlq = function(value) {
            var answer, nextChunk, signBit, valueToEncode;
            signBit = value < 0 ? 1 : 0;
            valueToEncode = (Math.abs(value) << 1) + signBit;
            answer = '';
            while (valueToEncode || !answer) {
                nextChunk = valueToEncode & VLQ_VALUE_MASK;
                valueToEncode = valueToEncode >> VLQ_SHIFT;
                if (valueToEncode) {
                    nextChunk |= VLQ_CONTINUATION_BIT;
                }
                answer += this.encodeBase64(nextChunk);
            }
            return answer;
        };

        BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        SourceMap.prototype.encodeBase64 = function(value) {
            return BASE64_CHARS[value] || (function() {
                throw new Error("Cannot Base64 encode value: " + value);
            })();
        };

        return SourceMap;

    })();

    module.exports = SourceMap;

}).call(this);
