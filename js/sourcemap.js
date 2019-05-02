// Generated by koffee 0.5.0
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
        answer = '';
        signBit = value < 0 ? 1 : 0;
        valueToEncode = (Math.abs(value) << 1) + signBit;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlbWFwLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBcUJBLElBQUE7O0FBQU07SUFFQyxpQkFBQyxLQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXO0lBRFo7O3NCQUdILEdBQUEsR0FBSyxTQUFDLE1BQUQsRUFBUyxHQUFULEVBQXFDLE9BQXJDO0FBQ0QsWUFBQTtRQURXLHFCQUFZOztZQUFlLFVBQVE7O1FBQzlDLElBQVUsSUFBQyxDQUFBLE9BQVEsQ0FBQSxNQUFBLENBQVQsSUFBcUIsT0FBTyxDQUFDLFNBQXZDO0FBQUEsbUJBQUE7O2VBQ0EsSUFBQyxDQUFBLE9BQVEsQ0FBQSxNQUFBLENBQVQsR0FBbUI7WUFBQyxJQUFBLEVBQU0sSUFBQyxDQUFBLElBQVI7WUFBYyxRQUFBLE1BQWQ7WUFBc0IsWUFBQSxVQUF0QjtZQUFrQyxjQUFBLFlBQWxDOztJQUZsQjs7c0JBSUwsY0FBQSxHQUFnQixTQUFDLE1BQUQ7QUFDWixZQUFBO0FBQVMsZUFBQSxDQUFBLENBQU0sQ0FBQyxPQUFBLEdBQVUsSUFBQyxDQUFBLE9BQVEsQ0FBQSxNQUFBLENBQXBCLENBQUEsSUFBZ0MsQ0FBQyxNQUFBLElBQVUsQ0FBWCxDQUF0QyxDQUFBO1lBQVQsTUFBQTtRQUFTO2VBQ1QsT0FBQSxJQUFZLENBQUMsT0FBTyxDQUFDLFVBQVQsRUFBcUIsT0FBTyxDQUFDLFlBQTdCO0lBRkE7Ozs7Ozs7QUFLcEI7Ozs7Ozs7O0FBY007QUFFRixRQUFBOztJQUFHLG1CQUFBO1FBQUcsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUFaOzt3QkFNSCxHQUFBLEdBQUssU0FBQyxjQUFELEVBQWlCLGlCQUFqQixFQUFvQyxPQUFwQztBQUNELFlBQUE7O1lBRHFDLFVBQVU7O1FBQzlDLDJCQUFELEVBQU87UUFDUCxPQUFBLEdBQVUsU0FBQyxJQUFDLENBQUEsTUFBTSxDQUFBLElBQUEsVUFBQSxDQUFBLElBQUEsSUFBVSxJQUFJLE9BQUosQ0FBWSxJQUFaLEVBQWxCO2VBQ1YsT0FBTyxDQUFDLEdBQVIsQ0FBWSxNQUFaLEVBQW9CLGNBQXBCLEVBQW9DLE9BQXBDO0lBSEM7O3dCQU9MLGNBQUEsR0FBZ0IsU0FBQyxHQUFEO0FBQ1osWUFBQTtRQURjLGVBQU07QUFDYixlQUFBLENBQUEsQ0FBTSxDQUFDLE9BQUEsR0FBVSxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBbEIsQ0FBQSxJQUE0QixDQUFDLElBQUEsSUFBUSxDQUFULENBQWxDLENBQUE7WUFBUCxJQUFBO1FBQU87ZUFDUCxPQUFBLElBQVksT0FBTyxDQUFDLGNBQVIsQ0FBdUIsTUFBdkI7SUFGQTs7d0JBY2hCLFFBQUEsR0FBVSxTQUFDLE9BQUQsRUFBZSxJQUFmO0FBQ04sWUFBQTs7WUFETyxVQUFVOzs7WUFBSSxPQUFPOztRQUM1QixXQUFBLEdBQW1CO1FBQ25CLFVBQUEsR0FBbUI7UUFDbkIsY0FBQSxHQUFtQjtRQUNuQixnQkFBQSxHQUFtQjtRQUNuQixTQUFBLEdBQW1CO1FBQ25CLE1BQUEsR0FBbUI7QUFFbkI7QUFBQSxhQUFBLCtEQUFBOztnQkFBdUM7QUFDbkM7QUFBQSxxQkFBQSx3Q0FBQTs7MEJBQW9DOzs7QUFDaEMsMkJBQU0sV0FBQSxHQUFjLE9BQU8sQ0FBQyxJQUE1Qjt3QkFDSSxVQUFBLEdBQWE7d0JBQ2IsU0FBQSxHQUFZO3dCQUNaLE1BQUEsSUFBVTt3QkFDVixXQUFBO29CQUpKO29CQVFBLElBQUcsU0FBSDt3QkFDSSxNQUFBLElBQVU7d0JBQ1YsU0FBQSxHQUFZLE1BRmhCOztvQkFVQSxNQUFBLElBQVUsSUFBQyxDQUFBLFNBQUQsQ0FBVyxPQUFPLENBQUMsTUFBUixHQUFpQixVQUE1QjtvQkFDVixVQUFBLEdBQWEsT0FBTyxDQUFDO29CQUlyQixNQUFBLElBQVUsSUFBQyxDQUFBLFNBQUQsQ0FBVyxDQUFYO29CQUlWLE1BQUEsSUFBVSxJQUFDLENBQUEsU0FBRCxDQUFXLE9BQU8sQ0FBQyxVQUFSLEdBQXFCLGNBQWhDO29CQUNWLGNBQUEsR0FBaUIsT0FBTyxDQUFDO29CQUl6QixNQUFBLElBQVUsSUFBQyxDQUFBLFNBQUQsQ0FBVyxPQUFPLENBQUMsWUFBUixHQUF1QixnQkFBbEM7b0JBQ1YsZ0JBQUEsR0FBbUIsT0FBTyxDQUFDO29CQUMzQixTQUFBLEdBQVk7QUFuQ2hCOztBQURKO1FBd0NBLEVBQUEsR0FDSTtZQUFBLE9BQUEsRUFBWSxDQUFaO1lBQ0EsSUFBQSxFQUFZLE9BQU8sQ0FBQyxhQUFSLElBQXlCLEVBRHJDO1lBRUEsVUFBQSxFQUFZLE9BQU8sQ0FBQyxVQUFSLElBQXNCLEVBRmxDO1lBR0EsT0FBQSxFQUFZLE9BQU8sQ0FBQyxXQUFSLElBQXVCLENBQUMsRUFBRCxDQUhuQztZQUlBLEtBQUEsRUFBWSxFQUpaO1lBS0EsUUFBQSxFQUFZLE1BTFo7O1FBT0osSUFBOEIsT0FBTyxDQUFDLFNBQXRDO1lBQUEsRUFBRSxDQUFDLGNBQUgsR0FBb0IsQ0FBQyxJQUFELEVBQXBCOztlQUVBO0lBMURNOztJQXdFVixTQUFBLEdBQW1DOztJQUNuQyxvQkFBQSxHQUF1QixDQUFBLElBQUs7O0lBQzVCLGNBQUEsR0FBMkIsb0JBQUEsR0FBdUI7O3dCQUVsRCxTQUFBLEdBQVcsU0FBQyxLQUFEO0FBQ1AsWUFBQTtRQUFBLE1BQUEsR0FBUztRQUdULE9BQUEsR0FBYSxLQUFBLEdBQVEsQ0FBWCxHQUFrQixDQUFsQixHQUF5QjtRQUduQyxhQUFBLEdBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxLQUFULENBQUEsSUFBbUIsQ0FBcEIsQ0FBQSxHQUF5QjtBQUd6QyxlQUFNLGFBQUEsSUFBaUIsQ0FBSSxNQUEzQjtZQUNJLFNBQUEsR0FBWSxhQUFBLEdBQWdCO1lBQzVCLGFBQUEsR0FBZ0IsYUFBQSxJQUFpQjtZQUNqQyxJQUFxQyxhQUFyQztnQkFBQSxTQUFBLElBQWEscUJBQWI7O1lBQ0EsTUFBQSxJQUFVLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZDtRQUpkO2VBTUE7SUFoQk87O0lBc0JYLFlBQUEsR0FBZTs7d0JBRWYsWUFBQSxHQUFjLFNBQUMsS0FBRDtlQUNWLFlBQWEsQ0FBQSxLQUFBLENBQWI7QUFBdUIsa0JBQU0sSUFBSSxLQUFKLENBQVUsOEJBQUEsR0FBK0IsS0FBekM7O0lBRG5COzs7Ozs7QUFNbEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIFNvdXJjZSBtYXBzIGFsbG93IEphdmFTY3JpcHQgcnVudGltZXMgdG8gbWF0Y2ggcnVubmluZyBKYXZhU2NyaXB0IGJhY2sgdG9cbiMgdGhlIG9yaWdpbmFsIHNvdXJjZSBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gaXQuIFRoaXMgY2FuIGJlIG1pbmlmaWVkXG4jIEphdmFTY3JpcHQsIGJ1dCBpbiBvdXIgY2FzZSwgd2UncmUgY29uY2VybmVkIHdpdGggbWFwcGluZyBwcmV0dHktcHJpbnRlZFxuIyBKYXZhU2NyaXB0IGJhY2sgdG8gS29mZmVlLlxuXG4jIEluIG9yZGVyIHRvIHByb2R1Y2UgbWFwcywgd2UgbXVzdCBrZWVwIHRyYWNrIG9mIHBvc2l0aW9ucyAobGluZSBudW1iZXIsIGNvbHVtbiBudW1iZXIpXG4jIHRoYXQgb3JpZ2luYXRlZCBldmVyeSBub2RlIGluIHRoZSBzeW50YXggdHJlZSwgYW5kIGJlIGFibGUgdG8gZ2VuZXJhdGUgYVxuIyBbbWFwIGZpbGVdKGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL2RvY3VtZW50L2QvMVUxUkdBZWhRd1J5cFVUb3ZGMUtSbHBpT0Z6ZTBiLV8yZ2M2ZkFIMEtZMGsvZWRpdClcbiMg4oCUIHdoaWNoIGlzIGEgY29tcGFjdCwgVkxRLWVuY29kZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIEpTT04gc2VyaWFsaXphdGlvblxuIyBvZiB0aGlzIGluZm9ybWF0aW9uIOKAlCB0byB3cml0ZSBvdXQgYWxvbmdzaWRlIHRoZSBnZW5lcmF0ZWQgSmF2YVNjcmlwdC5cblxuIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuXG4jIEEgKipMaW5lTWFwKiogb2JqZWN0IGtlZXBzIHRyYWNrIG9mIGluZm9ybWF0aW9uIGFib3V0IG9yaWdpbmFsIGxpbmUgYW5kIGNvbHVtblxuIyBwb3NpdGlvbnMgZm9yIGEgc2luZ2xlIGxpbmUgb2Ygb3V0cHV0IEphdmFTY3JpcHQgY29kZS5cbiMgKipTb3VyY2VNYXBzKiogYXJlIGltcGxlbWVudGVkIGluIHRlcm1zIG9mICoqTGluZU1hcHMqKi5cblxuY2xhc3MgTGluZU1hcFxuICAgIFxuICAgIEA6IChAbGluZSkgLT5cbiAgICAgICAgQGNvbHVtbnMgPSBbXVxuXG4gICAgYWRkOiAoY29sdW1uLCBbc291cmNlTGluZSwgc291cmNlQ29sdW1uXSwgb3B0aW9ucz17fSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIEBjb2x1bW5zW2NvbHVtbl0gYW5kIG9wdGlvbnMubm9SZXBsYWNlXG4gICAgICAgIEBjb2x1bW5zW2NvbHVtbl0gPSB7bGluZTogQGxpbmUsIGNvbHVtbiwgc291cmNlTGluZSwgc291cmNlQ29sdW1ufVxuXG4gICAgc291cmNlTG9jYXRpb246IChjb2x1bW4pIC0+XG4gICAgICAgIGNvbHVtbi0tIHVudGlsIChtYXBwaW5nID0gQGNvbHVtbnNbY29sdW1uXSkgb3IgKGNvbHVtbiA8PSAwKVxuICAgICAgICBtYXBwaW5nIGFuZCBbbWFwcGluZy5zb3VyY2VMaW5lLCBtYXBwaW5nLnNvdXJjZUNvbHVtbl1cblxuXG4jIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4jIyNcblxuIyBNYXBzIGxvY2F0aW9ucyBpbiBhIHNpbmdsZSBnZW5lcmF0ZWQgSmF2YVNjcmlwdCBmaWxlIGJhY2sgdG8gbG9jYXRpb25zIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZS5cblxuIyBUaGlzIGlzIGludGVudGlvbmFsbHkgYWdub3N0aWMgdG93YXJkcyBob3cgYSBzb3VyY2UgbWFwIG1pZ2h0IGJlIHJlcHJlc2VudGVkIG9uIGRpc2suIFxuIyBPbmNlIHRoZSBjb21waWxlciBpcyByZWFkeSB0byBwcm9kdWNlIGEgXCJ2M1wiLXN0eWxlIHNvdXJjZSBtYXAsIHdlIGNhbiB3YWxrXG4jIHRocm91Z2ggdGhlIGFycmF5cyBvZiBsaW5lIGFuZCBjb2x1bW4gYnVmZmVyIHRvIHByb2R1Y2UgaXQuXG5cbmNsYXNzIFNvdXJjZU1hcFxuICAgIFxuICAgIEA6IC0+IEBsaW5lcyA9IFtdXG5cbiAgICAjIEFkZHMgYSBtYXBwaW5nIHRvIHRoaXMgU291cmNlTWFwLiBcbiAgICAjIGBzb3VyY2VMb2NhdGlvbmAgYW5kIGBnZW5lcmF0ZWRMb2NhdGlvbmAgYXJlIGJvdGggYFtsaW5lLCBjb2x1bW5dYCBhcnJheXMuIFxuICAgICMgSWYgYG9wdGlvbnMubm9SZXBsYWNlYCBhbmQgdGhlcmUgaXMgYWxyZWFkeSBhIG1hcHBpbmcgZm9yIHRoZSBzcGVjaWZpZWQgYGxpbmVgIGFuZCBgY29sdW1uYCwgdGhpcyB3aWxsIGhhdmUgbm8gZWZmZWN0LlxuICAgIFxuICAgIGFkZDogKHNvdXJjZUxvY2F0aW9uLCBnZW5lcmF0ZWRMb2NhdGlvbiwgb3B0aW9ucyA9IHt9KSAtPlxuICAgICAgICBbbGluZSwgY29sdW1uXSA9IGdlbmVyYXRlZExvY2F0aW9uXG4gICAgICAgIGxpbmVNYXAgPSAoQGxpbmVzW2xpbmVdIG9yPSBuZXcgTGluZU1hcChsaW5lKSlcbiAgICAgICAgbGluZU1hcC5hZGQgY29sdW1uLCBzb3VyY2VMb2NhdGlvbiwgb3B0aW9uc1xuXG4gICAgIyBMb29rIHVwIHRoZSBvcmlnaW5hbCBwb3NpdGlvbiBvZiBhIGdpdmVuIGBsaW5lYCBhbmQgYGNvbHVtbmAgaW4gdGhlIGdlbmVyYXRlZCBjb2RlLlxuXG4gICAgc291cmNlTG9jYXRpb246IChbbGluZSwgY29sdW1uXSkgLT5cbiAgICAgICAgbGluZS0tIHVudGlsIChsaW5lTWFwID0gQGxpbmVzW2xpbmVdKSBvciAobGluZSA8PSAwKVxuICAgICAgICBsaW5lTWFwIGFuZCBsaW5lTWFwLnNvdXJjZUxvY2F0aW9uIGNvbHVtblxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgIyBCdWlsZHMgdXAgYSBWMyBzb3VyY2UgbWFwLCByZXR1cm5pbmcgdGhlIGdlbmVyYXRlZCBKU09OIGFzIGEgc3RyaW5nLlxuICAgICMgYG9wdGlvbnMuc291cmNlUm9vdGAgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgc291cmNlUm9vdCB3cml0dGVuIHRvIHRoZSBzb3VyY2UgbWFwLlxuICAgICMgQWxzbywgYG9wdGlvbnMuc291cmNlRmlsZXNgIGFuZCBgb3B0aW9ucy5nZW5lcmF0ZWRGaWxlYCBtYXkgYmUgcGFzc2VkIHRvIHNldCBcInNvdXJjZXNcIiBhbmQgXCJmaWxlXCIsIHJlc3BlY3RpdmVseS5cblxuICAgIGdlbmVyYXRlOiAob3B0aW9ucyA9IHt9LCBjb2RlID0gbnVsbCkgLT5cbiAgICAgICAgd3JpdGluZ2xpbmUgICAgICA9IDBcbiAgICAgICAgbGFzdENvbHVtbiAgICAgICA9IDBcbiAgICAgICAgbGFzdFNvdXJjZUxpbmUgICA9IDBcbiAgICAgICAgbGFzdFNvdXJjZUNvbHVtbiA9IDBcbiAgICAgICAgbmVlZENvbW1hICAgICAgICA9IG5vXG4gICAgICAgIGJ1ZmZlciAgICAgICAgICAgPSBcIlwiXG5cbiAgICAgICAgZm9yIGxpbmVNYXAsIGxpbmVOdW1iZXIgaW4gQGxpbmVzIHdoZW4gbGluZU1hcFxuICAgICAgICAgICAgZm9yIG1hcHBpbmcgaW4gbGluZU1hcC5jb2x1bW5zIHdoZW4gbWFwcGluZ1xuICAgICAgICAgICAgICAgIHdoaWxlIHdyaXRpbmdsaW5lIDwgbWFwcGluZy5saW5lXG4gICAgICAgICAgICAgICAgICAgIGxhc3RDb2x1bW4gPSAwXG4gICAgICAgICAgICAgICAgICAgIG5lZWRDb21tYSA9IG5vXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBcIjtcIlxuICAgICAgICAgICAgICAgICAgICB3cml0aW5nbGluZSsrXG5cbiAgICAgICAgICAgICAgICAjIFdyaXRlIGEgY29tbWEgaWYgd2UndmUgYWxyZWFkeSB3cml0dGVuIGEgc2VnbWVudCBvbiB0aGlzIGxpbmUuXG5cbiAgICAgICAgICAgICAgICBpZiBuZWVkQ29tbWFcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyICs9IFwiLFwiXG4gICAgICAgICAgICAgICAgICAgIG5lZWRDb21tYSA9IG5vXG5cbiAgICAgICAgICAgICAgICAjIFdyaXRlIHRoZSBuZXh0IHNlZ21lbnQuIFNlZ21lbnRzIGNhbiBiZSAxLCA0LCBvciA1IHZhbHVlcy4gICAgXG4gICAgICAgICAgICAgICAgIyBJZiBqdXN0IG9uZSwgdGhlbiBpdCBpcyBhIGdlbmVyYXRlZCBjb2x1bW4gd2hpY2ggZG9lc24ndCBtYXRjaCBhbnl0aGluZyBpbiB0aGUgc291cmNlIGNvZGUuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIyBUaGUgc3RhcnRpbmcgY29sdW1uIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLCByZWxhdGl2ZSB0byBhbnkgcHJldmlvdXMgcmVjb3JkZWRcbiAgICAgICAgICAgICAgICAjIGNvbHVtbiBmb3IgdGhlIGN1cnJlbnQgbGluZTpcblxuICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBAZW5jb2RlVmxxIG1hcHBpbmcuY29sdW1uIC0gbGFzdENvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RDb2x1bW4gPSBtYXBwaW5nLmNvbHVtblxuXG4gICAgICAgICAgICAgICAgIyBUaGUgaW5kZXggaW50byB0aGUgbGlzdCBvZiBzb3VyY2VzOlxuXG4gICAgICAgICAgICAgICAgYnVmZmVyICs9IEBlbmNvZGVWbHEgMFxuXG4gICAgICAgICAgICAgICAgIyBUaGUgc3RhcnRpbmcgbGluZSBpbiB0aGUgb3JpZ2luYWwgc291cmNlLCByZWxhdGl2ZSB0byB0aGUgcHJldmlvdXMgc291cmNlIGxpbmUuXG5cbiAgICAgICAgICAgICAgICBidWZmZXIgKz0gQGVuY29kZVZscSBtYXBwaW5nLnNvdXJjZUxpbmUgLSBsYXN0U291cmNlTGluZVxuICAgICAgICAgICAgICAgIGxhc3RTb3VyY2VMaW5lID0gbWFwcGluZy5zb3VyY2VMaW5lXG5cbiAgICAgICAgICAgICAgICAjIFRoZSBzdGFydGluZyBjb2x1bW4gaW4gdGhlIG9yaWdpbmFsIHNvdXJjZSwgcmVsYXRpdmUgdG8gdGhlIHByZXZpb3VzIGNvbHVtbi5cblxuICAgICAgICAgICAgICAgIGJ1ZmZlciArPSBAZW5jb2RlVmxxIG1hcHBpbmcuc291cmNlQ29sdW1uIC0gbGFzdFNvdXJjZUNvbHVtblxuICAgICAgICAgICAgICAgIGxhc3RTb3VyY2VDb2x1bW4gPSBtYXBwaW5nLnNvdXJjZUNvbHVtblxuICAgICAgICAgICAgICAgIG5lZWRDb21tYSA9IHllc1xuXG4gICAgICAgICMgUHJvZHVjZSB0aGUgY2Fub25pY2FsIEpTT04gb2JqZWN0IGZvcm1hdCBmb3IgYSBcInYzXCIgc291cmNlIG1hcC5cblxuICAgICAgICB2MyA9XG4gICAgICAgICAgICB2ZXJzaW9uOiAgICAzXG4gICAgICAgICAgICBmaWxlOiAgICAgICBvcHRpb25zLmdlbmVyYXRlZEZpbGUgb3IgJydcbiAgICAgICAgICAgIHNvdXJjZVJvb3Q6IG9wdGlvbnMuc291cmNlUm9vdCBvciAnJ1xuICAgICAgICAgICAgc291cmNlczogICAgb3B0aW9ucy5zb3VyY2VGaWxlcyBvciBbJyddXG4gICAgICAgICAgICBuYW1lczogICAgICBbXVxuICAgICAgICAgICAgbWFwcGluZ3M6ICAgYnVmZmVyXG5cbiAgICAgICAgdjMuc291cmNlc0NvbnRlbnQgPSBbY29kZV0gaWYgb3B0aW9ucy5pbmxpbmVNYXBcblxuICAgICAgICB2M1xuXG4jIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICBcblxuIyBOb3RlIHRoYXQgU291cmNlTWFwIFZMUSBlbmNvZGluZyBpcyBcImJhY2t3YXJkc1wiLiAgTUlESS1zdHlsZSBWTFEgZW5jb2RpbmcgcHV0c1xuIyB0aGUgbW9zdC1zaWduaWZpY2FudC1iaXQgKE1TQikgZnJvbSB0aGUgb3JpZ2luYWwgdmFsdWUgaW50byB0aGUgTVNCIG9mIHRoZSBWTFFcbiMgZW5jb2RlZCB2YWx1ZSAoc2VlIFtXaWtpcGVkaWFdKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZpbGU6VWludHZhcl9jb2Rpbmcuc3ZnKSkuXG4jIFNvdXJjZU1hcCBWTFEgZG9lcyB0aGluZ3MgdGhlIG90aGVyIHdheSBhcm91bmQsIHdpdGggdGhlIGxlYXN0IHNpZ25pZmljYXQgZm91clxuIyBiaXRzIG9mIHRoZSBvcmlnaW5hbCB2YWx1ZSBlbmNvZGVkIGludG8gdGhlIGZpcnN0IGJ5dGUgb2YgdGhlIFZMUSBlbmNvZGVkIHZhbHVlLlxuXG4gICAgVkxRX1NISUZUICAgICAgICAgICAgICAgICAgICAgICAgPSA1XG4gICAgVkxRX0NPTlRJTlVBVElPTl9CSVQgPSAxIDw8IFZMUV9TSElGVCAgICAgICAgICAgICAgICAgICAgICAgICAgICMgMDAxMCAwMDAwXG4gICAgVkxRX1ZBTFVFX01BU0sgICAgICAgICAgID0gVkxRX0NPTlRJTlVBVElPTl9CSVQgLSAxICAgICAjIDAwMDEgMTExMVxuXG4gICAgZW5jb2RlVmxxOiAodmFsdWUpIC0+XG4gICAgICAgIGFuc3dlciA9ICcnXG5cbiAgICAgICAgIyBMZWFzdCBzaWduaWZpY2FudCBiaXQgcmVwcmVzZW50cyB0aGUgc2lnbi5cbiAgICAgICAgc2lnbkJpdCA9IGlmIHZhbHVlIDwgMCB0aGVuIDEgZWxzZSAwXG5cbiAgICAgICAgIyBUaGUgbmV4dCBiaXRzIGFyZSB0aGUgYWN0dWFsIHZhbHVlLlxuICAgICAgICB2YWx1ZVRvRW5jb2RlID0gKE1hdGguYWJzKHZhbHVlKSA8PCAxKSArIHNpZ25CaXRcblxuICAgICAgICAjIE1ha2Ugc3VyZSB3ZSBlbmNvZGUgYXQgbGVhc3Qgb25lIGNoYXJhY3RlciwgZXZlbiBpZiB2YWx1ZVRvRW5jb2RlIGlzIDAuXG4gICAgICAgIHdoaWxlIHZhbHVlVG9FbmNvZGUgb3Igbm90IGFuc3dlclxuICAgICAgICAgICAgbmV4dENodW5rID0gdmFsdWVUb0VuY29kZSAmIFZMUV9WQUxVRV9NQVNLXG4gICAgICAgICAgICB2YWx1ZVRvRW5jb2RlID0gdmFsdWVUb0VuY29kZSA+PiBWTFFfU0hJRlRcbiAgICAgICAgICAgIG5leHRDaHVuayB8PSBWTFFfQ09OVElOVUFUSU9OX0JJVCBpZiB2YWx1ZVRvRW5jb2RlXG4gICAgICAgICAgICBhbnN3ZXIgKz0gQGVuY29kZUJhc2U2NCBuZXh0Q2h1bmtcblxuICAgICAgICBhbnN3ZXJcblxuXG4jIFJlZ3VsYXIgQmFzZTY0IEVuY29kaW5nXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBCQVNFNjRfQ0hBUlMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcblxuICAgIGVuY29kZUJhc2U2NDogKHZhbHVlKSAtPlxuICAgICAgICBCQVNFNjRfQ0hBUlNbdmFsdWVdIG9yIHRocm93IG5ldyBFcnJvciBcIkNhbm5vdCBCYXNlNjQgZW5jb2RlIHZhbHVlOiAje3ZhbHVlfVwiXG5cblxuIyBPdXIgQVBJIGZvciBzb3VyY2UgbWFwcyBpcyBqdXN0IHRoZSBgU291cmNlTWFwYCBjbGFzcy5cblxubW9kdWxlLmV4cG9ydHMgPSBTb3VyY2VNYXBcblxuXG5cbiJdfQ==
//# sourceURL=../coffee/sourcemap.coffee