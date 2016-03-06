import {
  RESET_STATE,
  RESET_STATE_FAILED,
  SWAP_STATE,
  SWAP_STATE_FAILED,
  EVENT_HANDLED,
  EVENT_FAILED,
  TOGGLE_ACTIVE
} from '../actions/types';

import {refresh} from '../actions/state';
import {typeOf} from '../symstr';
import {formatHTML} from '../builder';
import strategy from '../strategy';

const initialState = {
  current: -1,
  dom: '',
  error: null,
  isActive: true
};

export function getFrameHandlers(state) {
  function rec(d) {
    if (typeOf(d) !== 'object') return [];
    const fh = d.attributes.onframe ? [d.attributes.onframe] : [];
    return d.children.reduce((res, child) => [...res, ...rec(child)], fh);
  }
  return rec(state.state.dom);
}

function resetState(state, action) {
  const initial = action.state;
  const internal = strategy.add({current: -1}, initial);
  return {
    ...state,
    internal,
    current: 0,
    dom: action.dom,
    htmlstr: formatHTML(action.dom)
  };
}

function swapState(state, action) {
  return {
    ...state,
    current: action.idx,
    dom: action.dom,
    htmlstr: formatHTML(action.dom)
  };
}

function swapStateFailed(state, action) {
  return {
    ...state,
    error: action.error
  };
}

function resetStateFailed(state, action) {
  return {
    ...state,
    error: action.error
  };
}

function eventHandled(state, action) {
  setTimeout(() => action.dispatch(refresh()), 0);
  return {
    ...state,
    internal: strategy.add(state, action.state),
    current: state.current + 1,
    dom: action.dom,
    htmlstr: formatHTML(action.dom)
  };
}

function eventFailed(state, action) {
  return {
    ...state,
    isSwapping: false,
    error: action.error
  };
}

function toggleActive(state) {
  return {
    ...state,
    isActive: !!!state.isActive
  };
}

export default function stateReducer(state = initialState, action = {}) {
  switch (action.type) {
  case RESET_STATE: return resetState(state, action);
  case RESET_STATE_FAILED: return resetStateFailed(state, action);
  case SWAP_STATE: return swapState(state, action);
  case SWAP_STATE_FAILED: return swapStateFailed(state, action);
  case EVENT_HANDLED: return eventHandled(state, action);
  case EVENT_FAILED: return eventFailed(state, action);
  case TOGGLE_ACTIVE: return toggleActive(state, action);
  default: return state;
  }
}
