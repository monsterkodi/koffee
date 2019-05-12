// koffee 0.33.0

/*
 0000000   0000000   0000000   00000000   00000000  
000       000       000   000  000   000  000       
0000000   000       000   000  00000000   0000000   
     000  000       000   000  000        000       
0000000    0000000   0000000   000        00000000
 */

(function() {
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
            if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
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

}).call(this);
