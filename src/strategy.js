import deepFreeze from 'deep-freeze';
import clone from 'clone';

import {immutable, lazyFirstOrder, cow} from './proxies';
import stateMembrane from './proxy';
import {typeOf} from './symstr';

function checkState(state) {
  const ws = new WeakSet();
  function c(o) {
    if (typeOf(o) === 'function') {
      throw new Error('Functions not allowed in state');
    }
    if (typeOf(o) !== 'object') return;
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
  },
  current: ({state}) => {
    const states = state.internal || [];
    const current = state.current;
    if (current < 0 || current >= states.length) {
      return {};
    }
    return states[current];
  },
  add: (state, nextState) => {
    const pastStates = (state.internal || []).slice(0, state.current + 1);
    return [...pastStates, nextState];
  },
  maxState: ({state}) => {
    const states = state.internal || [];
    return states.length - 1;
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
  },
  current: simple.current,
  add: simple.add,
  maxState: simple.maxState
};

export const proxy = {
  handle: (handle, state) => {
    const membrane = stateMembrane(state);
    membrane.cow();
    window.state = membrane.getState();
    handle();
    return window.state;
  },
  render: (render, state) => {
    const membrane = stateMembrane(state);
    membrane.freeze();
    window.state = membrane.getState();
    try {
      return render();
    } finally {
      membrane.unfreeze();
    }
  },
  current: (state) => {
    const current = state.state.current;
    const membrane = stateMembrane(state.state.internal || {});
    membrane.timeTravel(current);
    return membrane.getState();
  },
  add: (state, nextState) => {
    const membrane = stateMembrane(state.internal || nextState);
    return membrane.getState();
  },
  maxState: ({state}) => {
    const membrane = stateMembrane(state.internal || {});
    return membrane.getMaxVersion();
  }
};

const defaultStrategy = (typeOf(window) === 'undefined' || typeOf(window.Proxy) !== 'undefined') ? proxy : simple;

const current = {
  handle: defaultStrategy.handle,
  render: defaultStrategy.render,
  current: defaultStrategy.current,
  add: defaultStrategy.add,
  maxState: defaultStrategy.maxState
};

export default current;
