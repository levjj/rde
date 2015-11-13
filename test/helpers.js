import {expect} from 'chai';

import {refresh} from '../src/actions/state';
import {ADD_VERSION, ADD_VERSION_FAILED} from '../src/actions/types';
import {addVersion} from '../src/actions/version';

export function runRender(state, func) {
  const action = refresh(func);
  return action(null, () => ({
    state: {
      states: [state],
      current: 0
    }
  }));
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
