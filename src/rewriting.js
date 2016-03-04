import {analyze} from 'escope';
import {replace} from 'estraverse-fb';

import {compileJSX} from './builder';
import {typeOf} from './symstr';

function stateVar(identifier) {
  return {
    type: 'MemberExpression',
    computed: false,
    object: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'Identifier',
        name: 'window'
      },
      property: {
        type: 'Identifier',
        name: 'state'
      }
    },
    property: identifier
  };
}

function stateAssign(identifier, value) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: stateVar(identifier),
      right: value || {type: 'Identifier', name: 'undefined'}
    }
  };
}

function initFun(init) {
  return {
    type: 'FunctionDeclaration',
    id: {type: 'Identifier', name: 'init'},
    params: [],
    defaults: [],
    body: {
      type: 'BlockStatement',
      body: init.map(decl => stateAssign(decl.id, decl.init))
    },
    generator: false,
    expression: false
  };
}

function returnRenderInit() {
  return {
    type: 'ReturnStatement',
    argument: {
      type: 'ArrayExpression',
      elements: [{
        type: 'Identifier',
        name: 'init'
      }, {
        type: 'Identifier',
        name: 'render'
      }]
    }
  };
}

export function rewriteJSX(ast) {
  return replace(ast, {
    enter: function enter(node) {
      if (node.type === 'JSXElement') {
        return compileJSX(node);
      }
      if (node.type === 'JSXExpressionContainer') {
        return node.expression;
      }
      return node;
    }
  });
}

export function rewriteState(ast) {
  const scopeManager = analyze(ast, {optimistic: true});
  const glob = scopeManager.globalScope;
  let scope = glob;
  let init = [];
  return replace(ast, {
    enter: function enter(node) {
      if (node.type === 'ReturnStatement' && scope === glob) {
        throw new Error('Unexpeced global return');
      }
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        scope = scopeManager.acquire(node);
      }
      if (node.type === 'VariableDeclaration' && scope === glob) {
        init = init.concat(node.declarations);
        return this.remove();
      }
      return node;
    },
    leave: function leave(node) {
      if (node.type === 'Identifier' && node.name !== '_') {
        const ref = scope.resolve(node);
        if (ref && ref.resolved && ref.resolved.scope === glob &&
            !(ref.resolved.defs[0].type === 'FunctionName')) {
          return stateVar(node);
        }
      }
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        scope = scope.upper;
      }
      if (node === glob.block) {
        node.body.push(initFun(init));
        node.body.push(returnRenderInit());
      }
      return node;
    }
  });
}

function globalOp(cat, name, ...args) {
  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'MemberExpression',
          computed: false,
          object: {
            type: 'Identifier',
            name: 'global'
          },
          property: {
            type: 'Identifier',
            name: 'operators'
          }
        },
        property: {
          type: 'Identifier',
          name: cat
        }
      },
      property: {
        type: 'Literal',
        value: name
      }
    },
    arguments: args
  };
}

function postfixUpdate(node, update) {
  return {
    type: 'CallExpression',
    callee: {
      type: 'FunctionExpression',
      id: null,
      params: [{
        type: 'Identifier',
        name: '__x'
      }],
      body: {
        type: 'BlockStatement',
        body: [{
          type: 'ExpressionStatement',
          expression: update
        }, {
          type: 'ReturnStatement',
          argument: {
            type: 'Identifier',
            name: '__x'
          }
        }]
      },
      rest: null,
      generator: false,
      expression: false
    },
    arguments: [{
      type: 'UnaryExpression',
      operator: '+',
      prefix: true,
      argument: node
    }]
  };
}

function desugarUpdate({argument, operator, prefix}) {
  const update = {
    type: 'AssignmentExpression',
    operator: '=',
    left: argument,
    right: {
      type: 'BinaryExpression',
      operator: operator[0],
      left: {
        type: 'UnaryExpression',
        operator: '+',
        prefix: true,
        argument
      },
      right: {type: 'Literal', value: 1}
    }
  };
  return prefix ? update : postfixUpdate(argument, update);
}

function desugarAssignment({operator, left, right}) {
  return {
    type: 'AssignmentExpression',
    operator: '=',
    left,
    right: {
      type: 'BinaryExpression',
      operator: operator.slice(0, -1),
      left,
      right
    }
  };
}

export function rewriteOps(ast) {
  return replace(ast, {
    enter: function enter(node) {
      if (node.type === 'AssignmentExpression' && node.operator !== '=') {
        return desugarAssignment(node);
      }
      if (node.type === 'UpdateExpression') {
        return desugarUpdate(node);
      }
      return node;
    },
    leave: function enter(node) {
      if (node.type === 'BinaryExpression') {
        return globalOp('binary', node.operator, node.left, node.right);
      }
      if (node.type === 'UnaryExpression') {
        return globalOp('unary', node.operator, node.argument);
      }
      return node;
    }
  });
}

let nextId = 1;

export function rewriteSymStrings(ast) {
  const mapping = {};
  const rewritten = replace(ast, {
    leave: function enter(node) {
      if (node.type === 'Literal' && typeOf(node.value) === 'string') {
        const id = nextId++;
        mapping[id] = node.range;
        return {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: 'global'
            },
            property: {
              type: 'Identifier',
              name: 'sym'
            }
          },
          arguments: [node, {type: 'Literal', value: id}]
        };
      }
      return node;
    }
  });
  return {ast: rewritten, mapping};
}
