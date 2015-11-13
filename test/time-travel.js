/* globals describe, it */
import {expect} from 'chai';

import {runRender, rewrite} from './helpers';
import {wrapHandler} from '../src/builder';

describe('time-travel', () => {
  global.window = {};

  it('changes to the state should not affect previous states', () => {
    const [, render] = rewrite('var i = 0; function render() { return function() { i++ }; }');
    const {dom} = runRender({i: 22}, render);
    const oldState = window.state;
    wrapHandler(() => 0, dom)();
    expect(oldState).to.be.deep.equal({i: 22});
    expect(window.state).to.be.deep.equal({i: 23});
  });
});

export default function() {}
