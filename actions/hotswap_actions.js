import {
  HOT_REQUEST,
  HOT_SWAP,
  HOT_SWAP_SUCCESS,
  HOT_SWAP_FAILED,
  EVENT_FAILED,
  EVENT_HANDLED
} from './action_types';

import {parse} from 'esprima';
import {analyze} from 'escope';
import {replace} from 'estraverse';
import {generate} from 'escodegen';

export function hotReqest(source) {
  return {
    type: HOT_REQUEST,
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

function gen(ast) {
  return generate(ast);
}

function setup(src) {
  return eval(src)();
}

// checks state for closures
function checkState(state) {
  const ws = new WeakSet();
  function c(o) {
    if (typeof o === 'function') {
      throw new Error('Functions not allowed in state');
    }
    if (typeof o !== 'object') return;
    ws.add(o);
    Object.getOwnPropertyNames(o).forEach((prop) => {
      if (o.hasOwnProperty(prop) &&
          o[prop] !== null &&
          !ws.has(o[prop])) {
        c(o[prop]);
      }
    });
  }
  c(state);
}

function initState(getState) {
  return ([init, render]) => {
    const state = getState().code;
    if (state.states.length === 0) {
      window.state = {};
      init();
      checkState(window.state);
    }
    return [init, render, window.state];
  };
}

export function hotSwap() {
  return {
    types: [HOT_SWAP, HOT_SWAP_SUCCESS, HOT_SWAP_FAILED],
    promise: (dispatch, getState) =>
      Promise.resolve(getState().code.source)
             .then(read)
             .then(check)
             .then(rewrite)
             .then(gen)
             .then(setup)
             .then(initState(getState))
  };
}

export function event() {
  try {
    checkState(window.state);
    return {
      type: EVENT_HANDLED,
      result: window.state
    };
  } catch(e) {
    return {
      type: EVENT_FAILED,
      error: e
    };
  }
}
