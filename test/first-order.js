/* globals describe, before, it */
import {expect} from 'chai';

import {EVENT_FAILED} from '../src/actions/types';
import current, {simple, proxies} from '../src/strategy';
import {runHandler} from './helpers';

global.window = {};

function tests() {
  it('allows event handling to write to the state', () => {
    const {state} = runHandler({i: 22}, () => window.state.i++);
    expect(state).to.be.deep.equal({i: 23});
  });

  it('should not allow render to write functions to the state', () => {
    const {type} = runHandler({}, () => {
      window.state.i = () => 0;
      window.state.i();
    });
    expect(type).to.be.equal(EVENT_FAILED);
  });
}

describe('first-order (simple)', () => {

  before(() => {
    current.handle = simple.handle;
    current.render = simple.render;
  });

  tests();
});

describe('first-order (proxies)', () => {

  before(() => {
    current.handle = proxies.handle;
    current.render = proxies.render;
  });

  tests();
});

export default function() {}
