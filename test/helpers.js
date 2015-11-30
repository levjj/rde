import {expect} from 'chai';

import {refresh} from '../src/actions/state';
import {ADD_VERSION, ADD_VERSION_FAILED} from '../src/actions/types';
import {addVersion} from '../src/actions/version';
import {wrapHandler} from '../src/builder';
import strategy from '../src/strategy';

export function runRenderInternal(internal, current, func) {
  const action = refresh(func);
  return action(null, () => ({
    state: {
      internal,
      current
    }
  }));
}

export function runRender(state, func) {
  return runRenderInternal(strategy.add({}, state), 0, func);
}

export function runHandlerInternal(internal, current, func) {
  let result;
  const dispatch = (act) => result = act(null, () => ({
    state: {
      internal,
      current,
      isActive: true
    },
    version: {
      versions: [{source: '', init: () => '', render: () => ''}],
      current: 0
    }
  }));
  try {
    wrapHandler(dispatch, func)();
  } finally {
    return result;
  }
}

export function runHandler(state, func) {
  return runHandlerInternal(strategy.add({}, state), 0, func);
}

export function rewrite(src) {
  const action = addVersion(src)();
  if (action.error) console.error(action.error, action.error.stack);
  expect(action.type).to.be.equal(ADD_VERSION);
  return [action.init, action.render];
}

export function shouldFail(src) {
  const action = addVersion(src)();
  expect(action.type).to.be.equal(ADD_VERSION_FAILED);
}
