/* globals describe, before, it */
import {expect} from 'chai';

import {EVENT_HANDLED} from '../src/actions/types';
import strategy from '../src/strategy';

import {runHandlerInternal} from './helpers';

export default function tests() {
  global.window = {};

  describe('time travel', () => {

    it('changes to the state should not affect previous states', () => {
      let internal = strategy.add({}, strategy.current({
        state: {current: -1}
      }));

      let result = runHandlerInternal(internal, 0, () => window.state.i = 23);
      expect(result.type).to.be.equal(EVENT_HANDLED);
      internal = strategy.add({internal, current: 0}, result.state);

      result = runHandlerInternal(internal, 1, () => window.state.i++);
      expect(result.type).to.be.equal(EVENT_HANDLED);
      internal = strategy.add({internal, current: 1}, result.state);

      const oldState = strategy.current({
        state: {internal, current: 1}
      });
      expect(oldState.i).to.be.equal(23);
      const newState = strategy.current({
        state: {internal, current: 2}
      });
      expect(newState.i).to.be.equal(24);
    });
  });
}
