/* globals describe, before, it */
import {expect} from 'chai';

import {SWAP_STATE_FAILED} from '../src/actions/types';
import current, {simple, proxies} from '../src/strategy';
import {runRender} from './helpers';

global.window = {};

function tests() {
  it('allows render to read the state', () => {
    const {dom} = runRender({x: 23}, () => window.state.x);
    expect(dom).to.be.equal(23);
  });

  it('should not allow render to write to the state', () => {
    const res = runRender({x: 23}, () => window.state.x++);
    expect(res.type).to.be.equal(SWAP_STATE_FAILED);
    expect(res.error).to.be.an.instanceof(TypeError);
  });
}

describe('immutability (simple)', () => {

  before(() => {
    current.handle = simple.handle;
    current.render = simple.render;
  });

  tests();
});

describe('immutability (proxies)', () => {

  before(() => {
    current.handle = proxies.handle;
    current.render = proxies.render;
  });

  tests();
});


export default function() {}
