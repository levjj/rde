import {
  HOT_REQUEST,
  HOT_SWAP,
  HOT_SWAP_SUCCESS,
  HOT_SWAP_FAILED
} from '../actions/action_types';
import { hotSwap as hotSwapAction } from '../actions/hotswap_actions';

const initialState = {
  source: '',
  isSwapping: false,
  request: null,
  a: 0,
  error: null
};

function hotReqest(state, action) {
  if (state.request) clearTimeout(state.request);
  return {
    ...state,
    source: action.source,
    request: setTimeout((() => action.dispatch(hotSwapAction(state.source))), 1000)
  }
}

function hotSwap(state, action) {
  return {
    ...state,
    isSwapping: true,
    request: null
  }
}

function hotSwapSuccess(state, action) {
  return {
    ...state,
    isSwapping: false,
    a: action.result
  }
}

function hotSwapFailed(state, action) {
  return {
    ...state,
    isSwapping: true,
    error: action.result
  }
}

export default function code(state = initialState, action = {}) {
  switch (action.type) {
  case HOT_REQUEST: return hotReqest(state, action);
  case HOT_SWAP: return hotSwap(state, action);
  case HOT_SWAP_SUCCESS: return hotSwapSuccess(state, action);
  case HOT_SWAP_FAILED: return hotSwapFailed(state, action);
  default: return state;
  }
}
