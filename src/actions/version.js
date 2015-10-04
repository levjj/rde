import {
  CHANGE_REQUEST,
  ADD_VERSION,
  ADD_VERSION_FAILED,
  SWAP_VERSION
} from './types';

import {parse} from 'esprima-fb';
import {analyze} from 'escope';
import {replace} from 'estraverse-fb';
import {generate} from 'escodegen';

import {compileJSX} from '../builder';
import {refresh} from './state';

export function changeReqest(source) {
  return {
    type: CHANGE_REQUEST,
    source: source
  };
}

function read(src) {
  return parse(`(function(){\n"use strict";\n${src} })`, {
    loc: true,
    range: true
  });
}

function check(ast) {
  const scopeManager = analyze(ast);
  const globalScope = scopeManager.globalScope;
  if (globalScope.through.length) {
    const r1 = globalScope.through[0];
    throw new ReferenceError(`${r1.identifier.name} is not defined`);
  }
  const inner = globalScope.childScopes[0];
  if (inner.thisFound) {
    throw new ReferenceError('this is not defined');
  }
  if (!inner.variables.some((v) => v.name === 'render' &&
                                   v.defs.length === 1 &&
                                   v.defs[0].type === 'FunctionName')) {
    throw new Error('Expected a "render" function');
  }
  return {ast, scopeManager};
}

function stateVar(identifier) {
  return {
    type: 'MemberExpression',
    computed: false,
    object: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'Identifier',
        name: 'GLOBAL'
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

function rewrite({ast, scopeManager}) {
  let scope = scopeManager.globalScope;
  const inner = scopeManager.globalScope.childScopes[0];
  let init = [];
  return replace(ast, {
    enter: function enter(node) {
      if (node.type === 'ReturnStatement' && scope === inner) {
        throw new Error('Unexpeced global return');
      }
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        scope = scopeManager.acquire(node);
      }
      if (node.type === 'VariableDeclaration' && scope === inner) {
        init = init.concat(node.declarations);
        return this.remove();
      }
      if (node.type === 'JSXElement') {
        return compileJSX(node);
      }
      if (node.type === 'JSXExpressionContainer') {
        return node.expression;
      }
      return node;
    },
    leave: function leave(node) {
      if (node.type === 'Identifier' && node.name !== '_') {
        const ref = scope.resolve(node);
        if (ref && ref.resolved.scope === inner &&
            !(ref.resolved.defs[0].type === 'FunctionName')) {
          return stateVar(node);
        }
      }
      if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
        scope = scope.upper;
      }
      if (node === inner.block) {
        node.body.body.push(initFun(init));
        node.body.body.push(returnRenderInit());
      }
      return node;
    }
  });
}

export function addVersion(source, global) {
  return () => {
    try {
      const ast = rewrite(check(read(source)));
      var GLOBAL = (typeof window !== 'undefined' ? window : global);
      const [init, render] = eval(generate(ast))();
      return {
        type: ADD_VERSION,
        source,
        init,
        render
      };
    } catch (e) {
      return {
        type: ADD_VERSION_FAILED,
        error: e
      };
    }
  };
}

export function swapVersion(idx) {
  return (dispatch, getState) => {
    dispatch(refresh(getState().version.versions[idx].render));
    return {
      type: SWAP_VERSION,
      idx: idx
    };
  };
}
