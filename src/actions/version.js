import {
  CHANGE_REQUEST,
  ADD_VERSION,
  ADD_VERSION_FAILED,
  SWAP_VERSION
} from './types';

import {analyze} from 'escope';
import {parse} from 'esprima-fb';
import {generate} from 'escodegen';

import {rewriteJSX, rewriteState, rewriteOps, rewriteSymStrings} from '../rewriting';
import {SymString, operators} from '../symstr.js';
import {refresh} from './state';

export function changeReqest(source) {
  return {
    type: CHANGE_REQUEST,
    source: source
  };
}

function check(ast) {
  const scopeManager = analyze(ast, {optimistic: true});
  const globalScope = scopeManager.globalScope;
  for (const {identifier: {name}, resolved} of globalScope.through) {
    if (resolved === null && name !== 'Math') {
      throw new ReferenceError(`${name} is not defined`);
    }
  }
  if (globalScope.thisFound) {
    throw new ReferenceError('this is not defined');
  }
  if (!globalScope.variables.some((v) => v.name === 'render' &&
                                         v.defs.length === 1 &&
                                         v.defs[0].type === 'FunctionName')) {
    throw new Error('Expected a "render" function');
  }
}

export function addVersion(source) {
  return () => {
    try {
      let ast = parse(source, {range: true});
      check(ast);
      ast = rewriteState(rewriteJSX(ast));
      const astAndMapping = rewriteSymStrings(ast);
      ast = rewriteOps(astAndMapping.ast);
      const generated = generate(ast);
      const wrapped = `(function(){\n"use strict";\n${generated} })`;
      /* eslint no-eval:0 */
      global.operators = operators;
      global.sym = SymString.single;
      const [init, render] = eval(wrapped)();
      return {
        type: ADD_VERSION,
        source,
        init,
        render,
        mapping: astAndMapping.mapping
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
