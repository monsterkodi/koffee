// koffee 1.19.0
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
        if (this.columns[column]) {
            console.log("LineMap has column " + column, sourceLine, sourceColumn, options);
            if (options.noReplace) {
                return;
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlbWFwLmpzIiwic291cmNlUm9vdCI6Ii4uL2NvZmZlZSIsInNvdXJjZXMiOlsic291cmNlbWFwLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBY0EsSUFBQTs7QUFBTTtJQUVDLGlCQUFDLEtBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDtRQUNBLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFEWjs7c0JBR0gsR0FBQSxHQUFLLFNBQUMsTUFBRCxFQUFTLEdBQVQsRUFBcUMsT0FBckM7QUFDRCxZQUFBO1FBRFcscUJBQVk7O1lBQWUsVUFBUTs7UUFDOUMsSUFBRyxJQUFDLENBQUEsT0FBUSxDQUFBLE1BQUEsQ0FBWjtZQUNHLE9BQUEsQ0FBQyxHQUFELENBQUsscUJBQUEsR0FBc0IsTUFBM0IsRUFBb0MsVUFBcEMsRUFBZ0QsWUFBaEQsRUFBOEQsT0FBOUQ7WUFDQyxJQUFHLE9BQU8sQ0FBQyxTQUFYO0FBQ0ksdUJBREo7YUFGSjs7ZUFJQSxJQUFDLENBQUEsT0FBUSxDQUFBLE1BQUEsQ0FBVCxHQUFtQjtZQUFDLElBQUEsRUFBTSxJQUFDLENBQUEsSUFBUjtZQUFjLFFBQUEsTUFBZDtZQUFzQixZQUFBLFVBQXRCO1lBQWtDLGNBQUEsWUFBbEM7O0lBTGxCOztzQkFPTCxjQUFBLEdBQWdCLFNBQUMsTUFBRDtBQUNaLFlBQUE7QUFBUyxlQUFBLENBQUEsQ0FBTSxDQUFDLE9BQUEsR0FBVSxJQUFDLENBQUEsT0FBUSxDQUFBLE1BQUEsQ0FBcEIsQ0FBQSxJQUFnQyxDQUFDLE1BQUEsSUFBVSxDQUFYLENBQXRDLENBQUE7WUFBVCxNQUFBO1FBQVM7ZUFDVCxPQUFBLElBQVksQ0FBQyxPQUFPLENBQUMsVUFBVCxFQUFxQixPQUFPLENBQUMsWUFBN0I7SUFGQTs7Ozs7OztBQUtwQjs7Ozs7Ozs7QUFjTTtBQUVGLFFBQUE7O0lBQUcsbUJBQUE7UUFBRyxJQUFDLENBQUEsS0FBRCxHQUFTO0lBQVo7O3dCQU1ILEdBQUEsR0FBSyxTQUFDLGNBQUQsRUFBaUIs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O1lBQ2pDLElBQXFDLGFBQXJDO2dCQUFBLFNBQUEsSUFBYSxxQkFBYjs7WUFDQSxNQUFBLElBQVUsSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFkO1FBSmQ7ZUFLQTtJQWJPOztJQWlCWCxZQUFBLEdBQWU7O3dCQUVmLFlBQUEsR0FBYyxTQUFDLEtBQUQ7ZUFBVyxZQUFhLENBQUEsS0FBQSxDQUFiO0FBQXVCLGtCQUFNLElBQUksS0FBSixDQUFVLDhCQUFBLEdBQStCLEtBQXpDOztJQUF4Qzs7Ozs7O0FBRWxCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyBJbiBvcmRlciB0byBwcm9kdWNlIHNvdXJjZSBtYXBzLCB3ZSBtdXN0IGtlZXAgdHJhY2sgb2Ygb3JpZ2luYWwgcG9zaXRpb25zIChsaW5lIG51bWJlciwgY29sdW1uIG51bWJlcilcbiMgZm9yIGV2ZXJ5IG5vZGUgaW4gdGhlIHN5bnRheCB0cmVlLlxuIyBbbWFwIGZpbGVdKGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL2RvY3VtZW50L2QvMVUxUkdBZWhRd1J5cFVUb3ZGMUtSbHBpT0Z6ZTBiLV8yZ2M2ZkFIMEtZMGsvZWRpdClcblxuIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuXG4jIEEgTGluZU1hcCBvYmplY3Qga2VlcHMgdHJhY2sgb2YgaW5mb3JtYXRpb24gYWJvdXQgb3JpZ2luYWwgbGluZSBhbmQgY29sdW1uXG4jIHBvc2l0aW9ucyBmb3IgYSBzaW5nbGUgbGluZSBvZiBvdXRwdXQgSmF2YVNjcmlwdCBjb2RlLlxuIyBTb3VyY2VNYXBzIGFyZSBpbXBsZW1lbnRlZCBpbiB0ZXJtcyBvZiBMaW5lTWFwcy5cblxuY2xhc3MgTGluZU1hcFxuICAgIFxuICAgIEA6IChAbGluZSkgLT5cbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuXG4gICAgYWRkOiAoY29sdW1uLCBbc291cmNlTGluZSwgc291cmNlQ29sdW1uXSwgb3B0aW9ucz17fSkgLT5cbiAgICAgICAgaWYgQGNvbHVtbnNbY29sdW1uXSBcbiAgICAgICAgICAgIGxvZyBcIkxpbmVNYXAgaGFzIGNvbHVtbiAje2NvbHVtbn1cIiBzb3VyY2VMaW5lLCBzb3VyY2VDb2x1bW4sIG9wdGlvbnNcbiAgICAgICAgICAgIGlmIG9wdGlvbnMubm9SZXBsYWNlXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBjb2x1bW5zW2NvbHVtbl0gPSB7bGluZTogQGxpbmUsIGNvbHVtbiwgc291cmNlTGluZSwgc291cmNlQ29sdW1ufVxuXG4gICAgc291cmNlTG9jYXRpb246IChjb2x1bW4pIC0+XG4gICAgICAgIGNvbHVtbi0tIHVudGlsIChtYXBwaW5nID0gQGNvbHVtbnNbY29sdW1uXSkgb3IgKGNvbHVtbiA8PSAwKVxuICAgICAgICBtYXBwaW5nIGFuZCBbbWFwcGluZy5zb3VyY2VMaW5lLCBtYXBwaW5nLnNvdXJjZUNvbHVtbl1cblxuXG4jIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4jIyNcblxuIyBNYXBzIGxvY2F0aW9ucyBpbiBhIHNpbmdsZSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCBmaWxlIGJhY2sgdG8gbG9jYXRpb25zIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZS5cblxuIyBUaGlzIGlzIGludGVudGlvbmFsbHkgYWdub3N0aWMgdG93YXJkcyBob3cgYSBzb3VyY2UgbWFwIG1pZ2h0IGJlIHJlcHJlc2VudGVkIG9uIGRpc2suIFxuIyBPbmNlIHRoZSBjb21waWxlciBpcyByZWFkeSB0byBwcm9kdWNlIGEgXCJ2M1wiLXN0eWxlIHNvdXJjZSBtYXAsIHdlIGNhbiB3YWxrXG4jIHRocm91Z2ggdGhlIGFycmF5cyBvZiBsaW5lIGFuZCBjb2x1bW4gYnVmZmVyIHRvIHByb2R1Y2UgaXQuXG5cbmNsYXNzIFNvdXJjZU1hcFxuICAgIFxuICAgIEA6IC0+IEBsaW5lcyA9IFtdXG5cbiAgICAjIEFkZHMgYSBtYXBwaW5nIHRvIHRoaXMgU291cmNlTWFwLiBcbiAgICAjIGBzb3VyY2VMb2NhdGlvbmAgYW5kIGBnZW5lcmF0ZWRMb2NhdGlvbmAgYXJlIGJvdGggYFtsaW5lLCBjb2x1bW5dYCBhcnJheXMuIFxuICAgICMgSWYgYG9wdGlvbnMubm9SZXBsYWNlYCBhbmQgdGhlcmUgaXMgYWxyZWFkeSBhIG1hcHBpbmcgZm9yIHRoZSBzcGVjaWZpZWQgYGxpbmVgIGFuZCBgY29sdW1uYCwgdGhpcyB3aWxsIGhhdmUgbm8gZWZmZWN0LlxuICAgIFxuICAgIGFkZDogKHNvdXJjZUxvY2F0aW9uLCBnZW5lcmF0ZWRMb2NhdGlvbiwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICBbbGluZSwgY29sdW1uXSA9IGdlbmVyYXRlZExvY2F0aW9uXG4gICAgICAgIGxpbmVNYXAgPSAoQGxpbmVzW2xpbmVdIG9yPSBuZXcgTGluZU1hcChsaW5lKSlcbiAgICAgICAgbGluZU1hcC5hZGQgY29sdW1uLCBzb3VyY2VMb2NhdGlvbiwgb3B0aW9uc1xuXG4gICAgIyBMb29rIHVwIHRoZSBvcmlnaW5hbCBwb3NpdGlvbiBvZiBhIGdpdmVuIGBsaW5lYCBhbmQgYGNvbHVtbmAgaW4gdGhlIGdlbmVyYXRlZCBjb2RlLlxuXG4gICAgc291cmNlTG9jYXRpb246IChbbGluZSwgY29sdW1uXSkgLT5cbiAgICAgICAgbGluZS0tIHVudGlsIChsaW5lTWFwID0gQGxpbmVzW2xpbmVdKSBvciAobGluZSA8PSAwKVxuICAgICAgICBsaW5lTWFwIGFuZCBsaW5lTWFwLnNvdXJjZUxvY2F0aW9uIGNvbHVtblxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBCdWlsZHMgdXAgYSBWMyBzb3VyY2UgbWFwLCByZXR1cm5pbmcgdGhlIGdlbmVyYXRlZCBKU09OIGFzIGEgc3RyaW5nLlxuICAgICMgYG9wdGlvbnMuc291cmNlUm9vdGAgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgc291cmNlUm9vdCB3cml0dGVuIHRvIHRoZSBzb3VyY2UgbWFwLlxuICAgICMgQWxzbywgYG9wdGlvbnMuc291cmNlRmlsZXNgIGFuZCBgb3B0aW9ucy5nZW5lcmF0ZWRGaWxlYCBtYXkgYmUgcGFzc2VkIHRvIHNldCBcInNvdXJjZXNcIiBhbmQgXCJmaWxlXCIsIHJlc3BlY3RpdmVseS5cblxuICAgIGdlbmVyYXRlOiAob3B0aW9ucyA9IHt9LCBjb2RlID0gbnVsbCkgLT5cbiAgICAgICAgXG4gICAgICAgIHdyaXRpbmdsaW5lICAgICAgPSAwXG4gICAgICAgIGxhc3RDb2x1bW4gICAgICAgPSAwXG4gICAgICAgIGxhc3RTb3VyY2VMaW5lICAgPSAwXG4gICAgICAgIGxhc3RTb3VyY2VDb2x1bW4gPSAwXG4gICAgICAgIG5lZWRDb21tYSAgICAgICAgPSBub1xuICAgICAgICBidWZmZXIgICAgICAgICAgID0gXCJcIlxuXG4gICAgICAgIGZvciBsaW5lTWFwLCBsaW5lTnVtYmVyIGluIEBsaW5lcyB3aGVuIGxpbmVNYXBcbiAgICAgICAgICAgIGZvciBtYXBwaW5nIGluIGxpbmVNYXAuY29sdW1ucyB3aGVuIG1hcHBpbmdcbiAgICAgICAgICAgICAgICB3aGlsZSB3cml0aW5nbGluZSA8IG1hcHBpbmcubGluZVxuICAgICAgICAgICAgICAgICAgICBsYXN0Q29sdW1uID0gMFxuICAgICAgICAgICAgICAgICAgICBuZWVkQ29tbWEgPSBub1xuICAgICAgICAgICAgICAgICAgICBidWZmZXIgKz0gXCI7XCJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGluZ2xpbmUrK1xuXG4gICAgICAgICAgICAgICAgIyBXcml0ZSBhIGNvbW1hIGlmIHdlJ3ZlIGFscmVhZHkgd3JpdHRlbiBhIHNlZ21lbnQgb24gdGhpcyBsaW5lLlxuXG4gICAgICAgICAgICAgICAgaWYgbmVlZENvbW1hXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBcIixcIlxuICAgICAgICAgICAgICAgICAgICBuZWVkQ29tbWEgPSBub1xuXG4gICAgICAgICAgICAgICAgIyBXcml0ZSB0aGUgbmV4dCBzZWdtZW50LiBTZWdtZW50cyBjYW4gYmUgMSwgNCwgb3IgNSB2YWx1ZXMuICAgIFxuICAgICAgICAgICAgICAgICMgSWYganVzdCBvbmUsIHRoZW4gaXQgaXMgYSBnZW5lcmF0ZWQgY29sdW1uIHdoaWNoIGRvZXNuJ3QgbWF0Y2ggYW55dGhpbmcgaW4gdGhlIHNvdXJjZSBjb2RlLlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICMgVGhlIHN0YXJ0aW5nIGNvbHVtbiBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZSwgcmVsYXRpdmUgdG8gYW55IHByZXZpb3VzIHJlY29yZGVkXG4gICAgICAgICAgICAgICAgIyBjb2x1bW4gZm9yIHRoZSBjdXJyZW50IGxpbmU6XG5cbiAgICAgICAgICAgICAgICBidWZmZXIgKz0gQGVuY29kZVZscSBtYXBwaW5nLmNvbHVtbiAtIGxhc3RDb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0Q29sdW1uID0gbWFwcGluZy5jb2x1bW5cblxuICAgICAgICAgICAgICAgICMgVGhlIGluZGV4IGludG8gdGhlIGxpc3Qgb2Ygc291cmNlczpcblxuICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBAZW5jb2RlVmxxIDBcblxuICAgICAgICAgICAgICAgICMgVGhlIHN0YXJ0aW5nIGxpbmUgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZSwgcmVsYXRpdmUgdG8gdGhlIHByZXZpb3VzIHNvdXJjZSBsaW5lLlxuXG4gICAgICAgICAgICAgICAgYnVmZmVyICs9IEBlbmNvZGVWbHEgbWFwcGluZy5zb3VyY2VMaW5lIC0gbGFzdFNvdXJjZUxpbmVcbiAgICAgICAgICAgICAgICBsYXN0U291cmNlTGluZSA9IG1hcHBpbmcuc291cmNlTGluZVxuXG4gICAgICAgICAgICAgICAgIyBUaGUgc3RhcnRpbmcgY29sdW1uIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UsIHJlbGF0aXZlIHRvIHRoZSBwcmV2aW91cyBjb2x1bW4uXG5cbiAgICAgICAgICAgICAgICBidWZmZXIgKz0gQGVuY29kZVZscSBtYXBwaW5nLnNvdXJjZUNvbHVtbiAtIGxhc3RTb3VyY2VDb2x1bW5cbiAgICAgICAgICAgICAgICBsYXN0U291cmNlQ29sdW1uID0gbWFwcGluZy5zb3VyY2VDb2x1bW5cbiAgICAgICAgICAgICAgICBuZWVkQ29tbWEgPSB5ZXNcblxuICAgICAgICAjIFByb2R1Y2UgdGhlIGNhbm9uaWNhbCBKU09OIG9iamVjdCBmb3JtYXQgZm9yIGEgXCJ2M1wiIHNvdXJjZSBtYXAuXG5cbiAgICAgICAgdjMgPVxuICAgICAgICAgICAgdmVyc2lvbjogICAgM1xuICAgICAgICAgICAgZmlsZTogICAgICAgb3B0aW9ucy5nZW5lcmF0ZWRGaWxlIG9yICcnXG4gICAgICAgICAgICBzb3VyY2VSb290OiBvcHRpb25zLnNvdXJjZVJvb3Qgb3IgJydcbiAgICAgICAgICAgIHNvdXJjZXM6ICAgIG9wdGlvbnMuc291cmNlRmlsZXMgb3IgWycnXVxuICAgICAgICAgICAgbmFtZXM6ICAgICAgW11cbiAgICAgICAgICAgIG1hcHBpbmdzOiAgIGJ1ZmZlclxuXG4gICAgICAgIHYzLnNvdXJjZXNDb250ZW50ID0gW2NvZGVdIGlmIG9wdGlvbnMuaW5saW5lTWFwXG4gICAgICAgIHYzXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBOb3RlIHRoYXQgU291cmNlTWFwIFZMUSBlbmNvZGluZyBpcyBcImJhY2t3YXJkc1wiLiAgTUlESS1zdHlsZSBWTFEgZW5jb2RpbmcgcHV0c1xuICAgICMgdGhlIG1vc3Qtc2lnbmlmaWNhbnQtYml0IChNU0IpIGZyb20gdGhlIG9yaWdpbmFsIHZhbHVlIGludG8gdGhlIE1TQiBvZiB0aGUgVkxRXG4gICAgIyBlbmNvZGVkIHZhbHVlIChzZWUgW1dpa2lwZWRpYV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlsZTpVaW50dmFyX2NvZGluZy5zdmcpKS5cbiAgICAjIFNvdXJjZU1hcCBWTFEgZG9lcyB0aGluZ3MgdGhlIG90aGVyIHdheSBhcm91bmQsIHdpdGggdGhlIGxlYXN0IHNpZ25pZmljYXQgZm91clxuICAgICMgYml0cyBvZiB0aGUgb3JpZ2luYWwgdmFsdWUgZW5jb2RlZCBpbnRvIHRoZSBmaXJzdCBieXRlIG9mIHRoZSBWTFEgZW5jb2RlZCB2YWx1ZS5cbiAgICBcbiAgICBWTFFfU0hJRlQgICAgICAgICAgICA9IDVcbiAgICBWTFFfQ09OVElOVUFUSU9OX0JJVCA9IDEgPDwgVkxRX1NISUZUICAgICAgICAgICAgIyAwMDEwIDAwMDBcbiAgICBWTFFfVkFMVUVfTUFTSyAgICAgICA9IFZMUV9DT05USU5VQVRJT05fQklUIC0gMSAgIyAwMDAxIDExMTFcblxuICAgIGVuY29kZVZscTogKHZhbHVlKSAtPlxuICAgICAgICBcbiAgICAgICAgc2lnbkJpdCA9IGlmIHZhbHVlIDwgMCB0aGVuIDEgZWxzZSAwICMgTGVhc3Qgc2lnbmlmaWNhbnQgYml0IHJlcHJlc2VudHMgdGhlIHNpZ24uXG5cbiAgICAgICAgdmFsdWVUb0VuY29kZSA9IChNYXRoLmFicyh2YWx1ZSkgPDwgMSkgKyBzaWduQml0ICMgVGhlIG5leHQgYml0cyBhcmUgdGhlIGFjdHVhbCB2YWx1ZS5cblxuICAgICAgICAjIE1ha2Ugc3VyZSB3ZSBlbmNvZGUgYXQgbGVhc3Qgb25lIGNoYXJhY3RlciwgZXZlbiBpZiB2YWx1ZVRvRW5jb2RlIGlzIDAuXG4gICAgICAgIGFuc3dlciA9ICcnXG4gICAgICAgIHdoaWxlIHZhbHVlVG9FbmNvZGUgb3Igbm90IGFuc3dlclxuICAgICAgICAgICAgbmV4dENodW5rID0gdmFsdWVUb0VuY29kZSAmIFZMUV9WQUxVRV9NQVNLXG4gICAgICAgICAgICB2YWx1ZVRvRW5jb2RlID0gdmFsdWVUb0VuY29kZSA+PiBWTFFfU0hJRlRcbiAgICAgICAgICAgIG5leHRDaHVuayB8PSBWTFFfQ09OVElOVUFUSU9OX0JJVCBpZiB2YWx1ZVRvRW5jb2RlXG4gICAgICAgICAgICBhbnN3ZXIgKz0gQGVuY29kZUJhc2U2NCBuZXh0Q2h1bmtcbiAgICAgICAgYW5zd2VyXG5cbiAgICAjIFJlZ3VsYXIgQmFzZTY0IEVuY29kaW5nXG5cbiAgICBCQVNFNjRfQ0hBUlMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcblxuICAgIGVuY29kZUJhc2U2NDogKHZhbHVlKSAtPiBCQVNFNjRfQ0hBUlNbdmFsdWVdIG9yIHRocm93IG5ldyBFcnJvciBcIkNhbm5vdCBCYXNlNjQgZW5jb2RlIHZhbHVlOiAje3ZhbHVlfVwiXG5cbm1vZHVsZS5leHBvcnRzID0gU291cmNlTWFwXG5cblxuXG4iXX0=
//# sourceURL=../coffee/sourcemap.coffee