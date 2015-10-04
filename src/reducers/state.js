import {
  RESET_STATE,
  RESET_STATE_FAILED,
  SWAP_STATE,
  SWAP_STATE_FAILED,
  EVENT_HANDLED,
  EVENT_FAILED,
  TOGGLE_ACTIVE
} from '../actions/types';

const initialState = {
  states: [],
  current: 0,
  dom: '',
  error: null,
  isActive: true
};

export function currentState(state) {
  const { states, current } = state.state;
  if (current < 0 || current >= states.length) {
    return {};
  }
  return states[current];
}

export function getFrameHandlers(state) {
  function rec(d) {
    if (typeof d !== 'object') return [];
    const fh = d.attributes.onframe ? [d.attributes.onframe] : [];
    return d.children.reduce((res, child) => [...res, ...rec(child)], fh);
  }
  return rec(state.state.dom);
}

function resetState(state, action) {
  return {
    ...state,
    states: [action.state],
    current: 0,
    dom: action.dom
  };
}

function swapState(state, action) {
  window.state = state.states[action.idx];
  return {
    ...state,
    current: action.idx,
    dom: action.dom
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
  const pastStates = state.states.slice(0, state.current + 1);
  return {
    ...state,
    states: [...pastStates, action.state],
    current: pastStates.length,
    dom: action.dom
  };
}

function eventFailed(state, action) {
  window.state = currentState({code: state});
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

export default function code(state = initialState, action = {}) {
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
