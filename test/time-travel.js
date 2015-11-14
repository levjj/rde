/* globals describe, it */
import {expect} from 'chai';

import {runHandler} from './helpers';

describe('time-travel', () => {
  global.window = {};

  it('changes to the state should not affect previous states', () => {
    const oldState = {i: 22};
    const {state} = runHandler(oldState, () => window.state.i++);
    expect(state).to.be.deep.equal({i: 23});
    expect(oldState).to.be.deep.equal({i: 22});
  });
});

export default function() {}
