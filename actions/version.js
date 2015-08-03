import {
  CHANGE_REQUEST,
  ADD_VERSION,
  ADD_VERSION_FAILED,
  SWAP_VERSION
} from './types';

import {parse} from 'esprima';
import {analyze} from 'escope';
import {replace} from 'estraverse';
import {generate} from 'escodegen';
import {refresh} from './state';

export function changeReqest(source) {
  return {
    type: CHANGE_REQUEST,
    source: source
  };
}

function read(src) {
  return parse(`(function(){\n"use strict";\nvar _;\n${src} })`, {
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
    throw new Error('Expected a single render function');
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

function importT(t) {
  return {
    type: 'VariableDeclaration',
    declarations: [{
      type: 'VariableDeclarator',
      id: {
        type: 'Identifier',
        name: t
      },
      init: {
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'Identifier',
          name: 'window'
        },
        property: {
          type: 'Identifier',
          name: t
        }
      }
    }],
    kind: 'var'
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
        if (node.declarations[0].id.name === '_') {
          return importT('_');
        }
        init = init.concat(node.declarations);
        return this.remove();
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

export function addVersion(source) {
  return (dispatch) => {
    try {
      const ast = rewrite(check(read(source)));
      const [init, render] = eval(generate(ast))();
      dispatch(refresh(render));
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
