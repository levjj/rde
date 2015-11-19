/* globals describe, before, it */
import {expect} from 'chai';

import {SWAP_STATE_FAILED} from '../src/actions/types';
import {runRender} from './helpers';


export default function tests() {
  global.window = {};

  describe('immutability', () => {

    it('allows render to read the state', () => {
      const {dom} = runRender({x: 23}, () => window.state.x);
      expect(dom).to.be.equal(23);
    });

    it('should not allow render to write to the state', () => {
      const res = runRender({x: 23}, () => window.state.x++);
      expect(res.type).to.be.equal(SWAP_STATE_FAILED);
      expect(res.error).to.be.an.instanceof(TypeError);
    });
  });
}
