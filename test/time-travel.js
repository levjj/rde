/* globals describe, before, it */
import {expect} from 'chai';

import current, {simple, proxies} from '../src/strategy';
import {runHandler} from './helpers';

function tests() {
  global.window = {};

  it('changes to the state should not affect previous states', () => {
    const oldState = {i: 22};
    const {state} = runHandler(oldState, () => {
      const j = window.state.i;
      window.state.i = j + 1;
    });
    expect(state).to.be.deep.equal({i: 23});
    expect(oldState).to.be.deep.equal({i: 22});
  });
}

describe('time travel (simple)', () => {

  before(() => {
    current.handle = simple.handle;
    current.render = simple.render;
  });

  tests();
});

describe('time travel (proxies)', () => {

  before(() => {
    current.handle = proxies.handle;
    current.render = proxies.render;
  });

  tests();
});

export default function() {}
