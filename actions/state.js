import {
  RESET_STATE,
  RESET_STATE_FAILED,
  SWAP_STATE,
  SWAP_STATE_FAILED,
  EVENT_FAILED,
  EVENT_HANDLED
} from './types';

import deepFreeze from 'deep-freeze';
import clone from 'clone';

import {currentState} from '../reducers/state';
import {currentVersion} from '../reducers/version';

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

function renderState(render, state) {
  if (!render || !state) return '';
  window.state = deepFreeze(clone(state));
  try {
    return render();
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error('render() needs to be a pure function!');
    }
    throw e;
  } finally {
    window.state = state;
  }
}

function renderCurrent(getState, state) {
  return renderState(currentVersion(getState()).render, state);
}

export function reset() {
  return (dispatch, getState) => {
    const {init} = currentVersion(getState());
    window.state = {};
    try {
      init();
      checkState(window.state);
      return {
        type: RESET_STATE,
        state: window.state,
        dom: renderCurrent(getState, window.state)
      };
    } catch (e) {
      return {
        type: RESET_STATE_FAILED,
        error: e
      };
    }
  };
}

export function refresh(render) {
  return (dispatch, getState) => {
    const state = getState();
    try {
      return {
        type: SWAP_STATE,
        idx: state.state.current,
        dom: renderState(render, currentState(state))
      };
    } catch(e) {
      return {
        type: SWAP_STATE_FAILED,
        error: e
      };
    }
  };
}

export function swapState(idx) {
  return (dispatch, getState) => {
    try {
      return {
        type: SWAP_STATE,
        idx: idx,
        dom: renderCurrent(getState, getState().state.states[idx])
      };
    } catch(e) {
      return {
        type: SWAP_STATE_FAILED,
        error: e
      };
    }
  };
}

export function event() {
  return (dispatch, getState) => {
    try {
      checkState(window.state);
      return {
        type: EVENT_HANDLED,
        state: window.state,
        dom: renderCurrent(getState, window.state)
      };
    } catch(e) {
      return {
        type: EVENT_FAILED,
        error: e
      };
    }
  };
}
