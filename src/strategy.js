import deepFreeze from 'deep-freeze';
import clone from 'clone';

import {immutable, lazyFirstOrder, cow} from './proxies';

function checkState(state) {
  const ws = new WeakSet();
  function c(o) {
    if (typeof o === 'function') {
      throw new Error('Functions not allowed in state');
    }
    if (typeof o !== 'object') return;
    ws.add(o);
    Object.getOwnPropertyNames(o).forEach((prop) => {
      if (o.hasOwnProperty(prop) &&
          o[prop] !== null &&
          !ws.has(o[prop])) {
        c(o[prop]);
      }
    });
  }
  c(state);
}

export const simple = {
  handle: (handle, state) => {
    window.state = clone(state);
    handle();
    checkState(window.state);
    return window.state;
  },
  render: (render, state) => {
    window.state = deepFreeze(clone(state));
    try {
      return render();
    } catch (e) {
      if (e instanceof TypeError) {
        throw new TypeError('render() needs to be a pure function!');
      }
      throw e;
    }
  }
};

export const proxies = {
  handle: (handle, state) => {
    window.state = lazyFirstOrder(cow(state));
    handle();
    return window.state;
  },
  render: (render, state) => {
    window.state = immutable(state);
    return render();
  }
};

export const proxy = {

};

const current = {
  handle: simple.handle,
  render: simple.render
};

export default current;
