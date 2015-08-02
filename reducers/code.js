import {
  HOT_REQUEST,
  HOT_SWAP,
  HOT_SWAP_SUCCESS,
  HOT_SWAP_FAILED,
  EVENT_HANDLED,
  EVENT_FAILED
} from '../actions/action_types';
import { hotSwap as hotSwapAction } from '../actions/hotswap_actions';

const initialState = {
  source: `var i = 23;

function click() {
    i++;
}

function render() {
    return _.div(
        _.h1("Demo"),
        _.p("Hello there: " + i),
        _.button({onclick: click}, "Click me")
    );
}`,
  isSwapping: false,
  request: null,
  states: [],
  render: null,
  init: null,
  error: null,
  versions: []
};

export function currentState(state) {
  if (state.code.states.length === 0) {
    return null;
  }
  return state.code.states[state.code.states.length - 1];
}

function hotReqest(state, action) {
  if (state.request) clearTimeout(state.request);
  return {
    ...state,
    source: action.source,
    request: setTimeout(() => action.dispatch(hotSwapAction(state.source)), 1000)
  };
}

function hotSwap(state) {
  return {
    ...state,
    isSwapping: true,
    request: null,
    error: null
  };
}

function hotSwapSuccess(state, action) {
  return {
    ...state,
    isSwapping: false,
    init: action.result[0],
    render: action.result[1],
    versions: [...state.versions, action.source],
    states: state.states.length === 0
           ? [action.result[2]]
           : state.states
  };
}

function hotSwapFailed(state, action) {
  return {
    ...state,
    isSwapping: false,
    error: action.error
  };
}

function eventHandled(state, action) {
  return {
    ...state,
    states: [...state.states, action.result]
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

export default function code(state = initialState, action = {}) {
  switch (action.type) {
  case HOT_REQUEST: return hotReqest(state, action);
  case HOT_SWAP: return hotSwap(state, action);
  case HOT_SWAP_SUCCESS: return hotSwapSuccess(state, action);
  case HOT_SWAP_FAILED: return hotSwapFailed(state, action);
  case EVENT_HANDLED: return eventHandled(state, action);
  case EVENT_FAILED: return eventFailed(state, action);
  default: return state;
  }
}
