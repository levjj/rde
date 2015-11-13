/* globals describe, it */
import {expect} from 'chai';

import {runRender, rewrite} from './helpers';
import {wrapHandler} from '../src/builder';

describe('first-order', () => {
  global.window = {};

  it('allows event handling to write to the state', () => {
    const [, render] = rewrite('var i = 0; function render() { return function() { i++ }; }');
    const {dom} = runRender({i: 22}, render);
    wrapHandler(() => 0, dom)();
    expect(window.state).to.be.deep.equal({i: 23});
  });

  it.skip('should not allow render to write functions to the state', () => {
    const [, render] = rewrite('var i = 0; function render() { return function() { i = render; }; }');
    const {dom} = runRender({}, render);
    const handler = wrapHandler(() => 0, dom);
    expect(() => handler()).to.throw(TypeError);
  });
});

export default function() {}
