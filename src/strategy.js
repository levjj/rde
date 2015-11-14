import deepFreeze from 'deep-freeze';
import clone from 'clone';

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
    } finally {
      window.state = state;
    }
  }
};

export const proxies = {

};

export const proxy = {

};

export default simple;
