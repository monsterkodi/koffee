// koffee 1.19.0

/*
 0000000   0000000   0000000   00000000   00000000  
000       000       000   000  000   000  000       
0000000   000       000   000  00000000   0000000   
     000  000       000   000  000        000       
0000000    0000000   0000000   000        00000000
 */
var Scope,
    indexOf = [].indexOf;

Scope = (function() {
    function Scope(parent, expressions, method, referencedVars) {
        var ref, ref1;
        this.parent = parent;
        this.expressions = expressions;
        this.method = method;
        this.referencedVars = referencedVars;
        this.variables = [
            {
                name: 'arguments',
                type: 'arguments'
            }
        ];
        this.positions = {};
        if (!this.parent) {
            this.utilities = {};
        }
        this.root = (ref = (ref1 = this.parent) != null ? ref1.root : void 0) != null ? ref : this;
    }

    Scope.prototype.add = function(name, type, immediate) {
        if (this.shared && !immediate) {
            return this.parent.add(name, type, immediate);
        }
        if (Object.hasOwn(this.positions, name)) {
            return this.variables[this.positions[name]].type = type;
        } else {
            return this.positions[name] = this.variables.push({
                name: name,
                type: type
            }) - 1;
        }
    };

    Scope.prototype.namedMethod = function() {
        var ref;
        if (((ref = this.method) != null ? ref.name : void 0) || !this.parent) {
            return this.method;
        }
        return this.parent.namedMethod();
    };

    Scope.prototype.find = function(name, type) {
        if (type == null) {
            type = 'var';
        }
        if (this.check(name)) {
            return true;
        }
        this.add(name, type);
        return false;
    };

    Scope.prototype.parameter = function(name) {
        if (this.shared && this.parent.check(name, true)) {
            return;
        }
        return this.add(name, 'param');
    };

    Scope.prototype.check = function(name) {
        var ref;
        return !!(this.type(name) || ((ref = this.parent) != null ? ref.check(name) : void 0));
    };

    Scope.prototype.temporary = function(name, index, single) {
        var diff, endCode, letter, newCode, num, startCode;
        if (single == null) {
            single = false;
        }
        if (single) {
            startCode = name.charCodeAt(0);
            endCode = 'z'.charCodeAt(0);
            diff = endCode - startCode;
            newCode = startCode + index % (diff + 1);
            letter = String.fromCharCode(newCode);
            num = Math.floor(index / (diff + 1));
            return "" + letter + (num || '');
        } else {
            return "" + name + (index || '');
        }
    };

    Scope.prototype.type = function(name) {
        var i, len, ref, v;
        ref = this.variables;
        for (i = 0, len = ref.length; i < len; i++) {
            v = ref[i];
            if (v.name === name) {
                return v.type;
            }
        }
        return null;
    };

    Scope.prototype.freeVariable = function(name, options) {
        var index, ref, temp;
        if (options == null) {
            options = {};
        }
        index = 0;
        while (true) {
            temp = this.temporary(name, index, options.single);
            if (!(this.check(temp) || indexOf.call(this.root.referencedVars, temp) >= 0)) {
                break;
            }
            index++;
        }
        if ((ref = options.reserve) != null ? ref : true) {
            this.add(temp, 'var', true);
        }
        return temp;
    };

    Scope.prototype.assign = function(name, value) {
        this.add(name, {
            value: value,
            assigned: true
        }, true);
        return this.hasAssignments = true;
    };

    Scope.prototype.hasDeclarations = function() {
        return !!this.declaredVariables().length;
    };

    Scope.prototype.declaredVariables = function() {
        var v;
        return ((function() {
            var i, len, ref, results;
            ref = this.variables;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
                v = ref[i];
                if (v.type === 'var') {
                    results.push(v.name);
                }
            }
            return results;
        }).call(this)).sort();
    };

    Scope.prototype.assignedVariables = function() {
        var i, len, ref, results, v;
        ref = this.variables;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
            v = ref[i];
            if (v.type.assigned) {
                results.push(v.name + " = " + v.type.value);
            }
        }
        return results;
    };

    return Scope;

})();

module.exports = Scope;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJzY29wZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsS0FBQTtJQUFBOztBQWFNO0lBT0MsZUFBQyxNQUFELEVBQVUsV0FBVixFQUF3QixNQUF4QixFQUFpQyxjQUFqQztBQUNDLFlBQUE7UUFEQSxJQUFDLENBQUEsU0FBRDtRQUFTLElBQUMsQ0FBQSxjQUFEO1FBQWMsSUFBQyxDQUFBLFNBQUQ7UUFBUyxJQUFDLENBQUEsaUJBQUQ7UUFDaEMsSUFBQyxDQUFBLFNBQUQsR0FBYTtZQUFDO2dCQUFDLElBQUEsRUFBTSxXQUFQO2dCQUFvQixJQUFBLEVBQU0sV0FBMUI7YUFBRDs7UUFDYixJQUFDLENBQUEsU0FBRCxHQUFhO1FBQ2IsSUFBbUIsQ0FBSSxJQUFDLENBQUEsTUFBeEI7WUFBQSxJQUFDLENBQUEsU0FBRCxHQUFhLEdBQWI7O1FBSUEsSUFBQyxDQUFBLElBQUQsNkVBQXdCO0lBUHpCOztvQkFXSCxHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLFNBQWI7UUFDRCxJQUE0QyxJQUFDLENBQUEsTUFBRCxJQUFZLENBQUksU0FBNUQ7QUFBQSxtQkFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLEVBQXdCLFNBQXhCLEVBQVA7O1FBQ0EsSUFBRyxNQUFNLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxTQUFmLEVBQTBCLElBQTFCLENBQUg7bUJBQ0ksSUFBQyxDQUFBLFNBQVUsQ0FBQSxJQUFDLENBQUEsU0FBVSxDQUFBLElBQUEsQ0FBWCxDQUFpQixDQUFDLElBQTdCLEdBQW9DLEtBRHhDO1NBQUEsTUFBQTttQkFHSSxJQUFDLENBQUEsU0FBVSxDQUFBLElBQUEsQ0FBWCxHQUFtQixJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0I7Z0JBQUMsTUFBQSxJQUFEO2dC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Q0FBQSxDQUFvQixDQUFDO0lBQTFCOztvQkFJakIsaUJBQUEsR0FBbUIsU0FBQTtBQUFHLFlBQUE7ZUFBQTs7QUFBQztBQUFBO2lCQUFBLHFDQUFBOztvQkFBZ0MsQ0FBQyxDQUFDLElBQUYsS0FBVTtpQ0FBMUMsQ0FBQyxDQUFDOztBQUFGOztxQkFBRCxDQUFpRCxDQUFDLElBQWxELENBQUE7SUFBSDs7b0JBSW5CLGlCQUFBLEdBQW1CLFNBQUE7QUFBRyxZQUFBO0FBQUE7QUFBQTthQUFBLHFDQUFBOztnQkFBdUQsQ0FBQyxDQUFDLElBQUksQ0FBQzs2QkFBM0QsQ0FBQyxDQUFDLElBQUgsR0FBUSxLQUFSLEdBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQzs7QUFBdEI7O0lBQUg7Ozs7OztBQUV2QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIFxuIyMjXG5cbiMgVGhlIFNjb3BlIGNsYXNzIHJlZ3VsYXRlcyBsZXhpY2FsIHNjb3BpbmcuIFxuIyBBcyB5b3UgZ2VuZXJhdGUgY29kZSwgeW91IGNyZWF0ZSBhIHRyZWUgb2Ygc2NvcGVzIGluIHRoZSBzYW1lIHNoYXBlIGFzIHRoZSBuZXN0ZWQgZnVuY3Rpb24gYm9kaWVzLiBcbiMgRWFjaCBzY29wZSBrbm93cyBhYm91dCB0aGUgdmFyaWFibGVzIGRlY2xhcmVkIHdpdGhpbiBpdCwgYW5kIGhhcyBhIHJlZmVyZW5jZSB0byBpdHMgcGFyZW50IGVuY2xvc2luZyBzY29wZS4gXG4jIEluIHRoaXMgd2F5LCB3ZSBrbm93IHdoaWNoIHZhcmlhYmxlcyBhcmUgbmV3IGFuZCBuZWVkIHRvIGJlIGRlY2xhcmVkIHdpdGggYHZhcmAsIGFuZCB3aGljaCBhcmUgc2hhcmVkIHdpdGggZXh0ZXJuYWwgc2NvcGVzLlxuXG5jbGFzcyBTY29wZVxuXG4gICAgIyBJbml0aWFsaXplIGEgc2NvcGUgd2l0aCBpdHMgcGFyZW50LCBmb3IgbG9va3VwcyB1cCB0aGUgY2hhaW4sXG4gICAgIyBhcyB3ZWxsIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBCbG9jayBub2RlIGl0IGJlbG9uZ3MgdG8sIFxuICAgICMgd2hpY2ggaXMgd2hlcmUgaXQgc2hvdWxkIGRlY2xhcmUgaXRzIHZhcmlhYmxlcywgYSByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIHRoYXQgaXQgYmVsb25ncyB0bywgXG4gICAgIyBhbmQgYSBsaXN0IG9mIHZhcmlhYmxlcyByZWZlcmVuY2VkIGluIHRoZSBzb3VyY2UgY29kZSBhbmQgdGhlcmVmb3JlIHNob3VsZCBiZSBhdm9pZGVkIHdoZW4gZ2VuZXJhdGluZyB2YXJpYWJsZXMuXG4gICAgXG4gICAgQDogKEBwYXJlbnQsIEBleHByZXNzaW9ucywgQG1ldGhvZCwgQHJlZmVyZW5jZWRWYXJzKSAtPlxuICAgICAgICBAdmFyaWFibGVzID0gW3tuYW1lOiAnYXJndW1lbnRzJywgdHlwZTogJ2FyZ3VtZW50cyd9XVxuICAgICAgICBAcG9zaXRpb25zID0ge31cbiAgICAgICAgQHV0aWxpdGllcyA9IHt9IGlmIG5vdCBAcGFyZW50XG5cbiAgICAgICAgIyBUaGUgYEByb290YCBpcyB0aGUgdG9wLWxldmVsIFNjb3BlIG9iamVjdCBmb3IgYSBnaXZlbiBmaWxlLlxuXG4gICAgICAgIEByb290ID0gQHBhcmVudD8ucm9vdCA/IHRoaXNcblxuICAgICMgQWRkcyBhIG5ldyB2YXJpYWJsZSBvciBvdmVycmlkZXMgYW4gZXhpc3Rpbmcgb25lLlxuXG4gICAgYWRkOiAobmFtZSwgdHlwZSwgaW1tZWRpYXRlKSAtPlxuICAgICAgICByZXR1cm4gQHBhcmVudC5hZGQgbmFtZSwgdHlwZSwgaW1tZWRpYXRlIGlmIEBzaGFyZWQgYW5kIG5vdCBpbW1lZGlhdGVcbiAgICAgICAgaWYgT2JqZWN0Lmhhc093biBAcG9zaXRpb25zLCBuYW1lXG4gICAgICAgICAgICBAdmFyaWFibGVzW0Bwb3NpdGlvbnNbbmFtZV1dLnR5cGUgPSB0eXBlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBwb3NpdGlvbnNbbmFtZV0gPSBAdmFyaWFibGVzLnB1c2goe25hbWUsIHR5cGV9KSAtIDFcblxuICAgICMgV2hlbiBgc3VwZXJgIGlzIGNhbGxlZCwgd2UgbmVlZCB0byBmaW5kIHRoZSBuYW1lIG9mIHRoZSBjdXJyZW50IG1ldGhvZCB3ZSdyZVxuICAgICMgaW4sIHNvIHRoYXQgd2Uga25vdyBob3cgdG8gaW52b2tlIHRoZSBzYW1lIG1ldGhvZCBvZiB0aGUgcGFyZW50IGNsYXNzLiBUaGlzXG4gICAgIyBjYW4gZ2V0IGNvbXBsaWNhdGVkIGlmIHN1cGVyIGlzIGJlaW5nIGNhbGxlZCBmcm9tIGFuIGlubmVyIGZ1bmN0aW9uLlxuICAgICMgYG5hbWVkTWV0aG9kYCB3aWxsIHdhbGsgdXAgdGhlIHNjb3BlIHRyZWUgdW50aWwgaXQgZWl0aGVyIGZpbmRzIHRoZSBmaXJzdFxuICAgICMgZnVuY3Rpb24gb2JqZWN0IHRoYXQgaGFzIGEgbmFtZSBmaWxsZWQgaW4sIG9yIGJvdHRvbXMgb3V0LlxuXG4gICAgbmFtZWRNZXRob2Q6IC0+XG4gICAgICAgIHJldHVybiBAbWV0aG9kIGlmIEBtZXRob2Q/Lm5hbWUgb3IgIUBwYXJlbnRcbiAgICAgICAgQHBhcmVudC5uYW1lZE1ldGhvZCgpXG5cbiAgICAjIExvb2sgdXAgYSB2YXJpYWJsZSBuYW1lIGluIGxleGljYWwgc2NvcGUsIGFuZCBkZWNsYXJlIGl0IGlmIGl0IGRvZXMgbm90IGFscmVhZHkgZXhpc3QuXG5cbiAgICBmaW5kOiAobmFtZSwgdHlwZSA9ICd2YXInKSAtPlxuICAgICAgICByZXR1cm4geWVzIGlmIEBjaGVjayBuYW1lXG4gICAgICAgIEBhZGQgbmFtZSwgdHlwZVxuICAgICAgICBub1xuXG4gICAgIyBSZXNlcnZlIGEgdmFyaWFibGUgbmFtZSBhcyBvcmlnaW5hdGluZyBmcm9tIGEgZnVuY3Rpb24gcGFyYW1ldGVyIGZvciB0aGlzIHNjb3BlLiBcbiAgICAjIE5vIGB2YXJgIHJlcXVpcmVkIGZvciBpbnRlcm5hbCByZWZlcmVuY2VzLlxuXG4gICAgcGFyYW1ldGVyOiAobmFtZSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIEBzaGFyZWQgYW5kIEBwYXJlbnQuY2hlY2sgbmFtZSwgeWVzXG4gICAgICAgIEBhZGQgbmFtZSwgJ3BhcmFtJ1xuXG4gICAgIyBKdXN0IGNoZWNrIHRvIHNlZSBpZiBhIHZhcmlhYmxlIGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWQsIHdpdGhvdXQgcmVzZXJ2aW5nLCB3YWxrcyB1cCB0byB0aGUgcm9vdCBzY29wZS5cblxuICAgIGNoZWNrOiAobmFtZSkgLT4gISEoQHR5cGUobmFtZSkgb3IgQHBhcmVudD8uY2hlY2sobmFtZSkpXG5cbiAgICAjIEdlbmVyYXRlIGEgdGVtcG9yYXJ5IHZhcmlhYmxlIG5hbWUgYXQgdGhlIGdpdmVuIGluZGV4LlxuXG4gICAgdGVtcG9yYXJ5OiAobmFtZSwgaW5kZXgsIHNpbmdsZT1mYWxzZSkgLT5cbiAgICAgICAgaWYgc2luZ2xlXG4gICAgICAgICAgICBzdGFydENvZGUgPSBuYW1lLmNoYXJDb2RlQXQoMClcbiAgICAgICAgICAgIGVuZENvZGUgPSAneicuY2hhckNvZGVBdCgwKVxuICAgICAgICAgICAgZGlmZiA9IGVuZENvZGUgLSBzdGFydENvZGVcbiAgICAgICAgICAgIG5ld0NvZGUgPSBzdGFydENvZGUgKyBpbmRleCAlIChkaWZmICsgMSlcbiAgICAgICAgICAgIGxldHRlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUobmV3Q29kZSlcbiAgICAgICAgICAgIG51bSA9IGluZGV4IC8vIChkaWZmICsgMSlcbiAgICAgICAgICAgIFwiI3tsZXR0ZXJ9I3tudW0gb3IgJyd9XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXCIje25hbWV9I3tpbmRleCBvciAnJ31cIlxuXG4gICAgIyBHZXRzIHRoZSB0eXBlIG9mIGEgdmFyaWFibGUuXG5cbiAgICB0eXBlOiAobmFtZSkgLT5cbiAgICAgICAgcmV0dXJuIHYudHlwZSBmb3IgdiBpbiBAdmFyaWFibGVzIHdoZW4gdi5uYW1lIGlzIG5hbWVcbiAgICAgICAgbnVsbFxuXG4gICAgIyBJZiB3ZSBuZWVkIHRvIHN0b3JlIGFuIGludGVybWVkaWF0ZSByZXN1bHQsIGZpbmQgYW4gYXZhaWxhYmxlIG5hbWUgZm9yIGFcbiAgICAjIGNvbXBpbGVyLWdlbmVyYXRlZCB2YXJpYWJsZS4gYF92YXJgLCBgX3ZhcjJgLCBhbmQgc28gb24uLi5cblxuICAgIGZyZWVWYXJpYWJsZTogKG5hbWUsIG9wdGlvbnM9e30pIC0+XG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBsb29wXG4gICAgICAgICAgICB0ZW1wID0gQHRlbXBvcmFyeSBuYW1lLCBpbmRleCwgb3B0aW9ucy5zaW5nbGVcbiAgICAgICAgICAgIGJyZWFrIHVubGVzcyBAY2hlY2sodGVtcCkgb3IgdGVtcCBpbiBAcm9vdC5yZWZlcmVuY2VkVmFyc1xuICAgICAgICAgICAgaW5kZXgrK1xuICAgICAgICBAYWRkIHRlbXAsICd2YXInLCB5ZXMgaWYgb3B0aW9ucy5yZXNlcnZlID8gdHJ1ZVxuICAgICAgICB0ZW1wXG5cbiAgICAjIEVuc3VyZSB0aGF0IGFuIGFzc2lnbm1lbnQgaXMgbWFkZSBhdCB0aGUgdG9wIG9mIHRoaXMgc2NvcGUgKG9yIGF0IHRoZSB0b3AtbGV2ZWwgc2NvcGUsIGlmIHJlcXVlc3RlZCkuXG5cbiAgICBhc3NpZ246IChuYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgQGFkZCBuYW1lLCB7dmFsdWUsIGFzc2lnbmVkOiB5ZXN9LCB5ZXNcbiAgICAgICAgQGhhc0Fzc2lnbm1lbnRzID0geWVzXG5cbiAgICAjIERvZXMgdGhpcyBzY29wZSBoYXZlIGFueSBkZWNsYXJlZCB2YXJpYWJsZXM/XG5cbiAgICBoYXNEZWNsYXJhdGlvbnM6IC0+ICEhQGRlY2xhcmVkVmFyaWFibGVzKCkubGVuZ3RoXG5cbiAgICAjIFJldHVybiB0aGUgbGlzdCBvZiB2YXJpYWJsZXMgZmlyc3QgZGVjbGFyZWQgaW4gdGhpcyBzY29wZS5cblxuICAgIGRlY2xhcmVkVmFyaWFibGVzOiAtPiAodi5uYW1lIGZvciB2IGluIEB2YXJpYWJsZXMgd2hlbiB2LnR5cGUgaXMgJ3ZhcicpLnNvcnQoKVxuXG4gICAgIyBSZXR1cm4gdGhlIGxpc3Qgb2YgYXNzaWdubWVudHMgdGhhdCBhcmUgc3VwcG9zZWQgdG8gYmUgbWFkZSBhdCB0aGUgdG9wIG9mIHRoaXMgc2NvcGUuXG5cbiAgICBhc3NpZ25lZFZhcmlhYmxlczogLT4gXCIje3YubmFtZX0gPSAje3YudHlwZS52YWx1ZX1cIiBmb3IgdiBpbiBAdmFyaWFibGVzIHdoZW4gdi50eXBlLmFzc2lnbmVkXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBTY29wZVxuIl19
//# sourceURL=../coffee/scope.coffee