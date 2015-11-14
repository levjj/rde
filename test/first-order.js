/* globals describe, it */
import {expect} from 'chai';

import {EVENT_FAILED} from '../src/actions/types';
import {runHandler} from './helpers';

describe('first-order', () => {
  global.window = {};

  it('allows event handling to write to the state', () => {
    const {state} = runHandler({i: 22}, () => window.state.i++);
    expect(state).to.be.deep.equal({i: 23});
  });

  it('should not allow render to write functions to the state', () => {
    const {type} = runHandler({}, () => window.state.i = () => 0);
    expect(type).to.be.equal(EVENT_FAILED);
  });
});

export default function() {}
