import {
  RESET_STATE,
  RESET_STATE_FAILED,
  SWAP_STATE,
  SWAP_STATE_FAILED,
  EVENT_FAILED,
  EVENT_HANDLED,
  TOGGLE_ACTIVE
} from './types';

import {getFrameHandlers} from '../reducers/state';
import {currentVersion} from '../reducers/version';
import strategy from '../strategy';

function renderState(render, state) {
  if (!render || !state) return '';
  return strategy.render(render, state);
}

function renderCurrent(getState, state) {
  return renderState(currentVersion(getState()).render, state);
}

export function reset() {
  return (dispatch, getState) => {
    const {init} = currentVersion(getState());
    try {
      const state = strategy.handle(() => init(), {});
      return {
        type: RESET_STATE,
        state,
        dom: renderCurrent(getState, state)
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
        dom: renderState(render, strategy.current(state))
      };
    } catch (e) {
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
    } catch (e) {
      return {
        type: SWAP_STATE_FAILED,
        error: e
      };
    }
  };
}

export function event(handler) {
  return (dispatch, getState) => {
    if (!getState().state.isActive) {
      return { type: 'noop' };
    }
    try {
      const state = strategy.handle(handler, strategy.current(getState()));
      return {
        type: EVENT_HANDLED,
        state,
        dom: renderCurrent(getState, state)
      };
    } catch (e) {
      return {
        type: EVENT_FAILED,
        error: e
      };
    }
  };
}

export function frame() {
  return (dispatch, getState) => {
    const {isActive} = getState().state;
    const frameHandlers = getFrameHandlers(getState());
    if (!isActive || !frameHandlers || !frameHandlers.length) {
      return { type: 'noop' };
    }
    try {
      const handler = () => frameHandlers.forEach(h => h());
      const state = strategy.handle(handler, strategy.current(getState()));
      return {
        type: EVENT_HANDLED,
        state,
        dom: renderCurrent(getState, state)
      };
    } catch (e) {
      return {
        type: EVENT_FAILED,
        error: e
      };
    }
  };
}

export function toggleActive() {
  return (dispatch, getState) => {
    dispatch(refresh(currentVersion(getState()).render));
    return {
      type: TOGGLE_ACTIVE
    };
  };
}
