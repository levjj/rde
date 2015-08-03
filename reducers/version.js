import {
  CHANGE_REQUEST,
  ADD_VERSION,
  ADD_VERSION_FAILED,
  SWAP_VERSION
} from '../actions/types';

import { addVersion as doAddVersion } from '../actions/version';

const initialState = {
  source: '',
  request: null,
  versions: [],
  current: -1,
  error: null
};

export function currentVersion(state) {
  const { versions, current } = state.version;
  if (current < 0 || current >= versions.length) {
    return {
      source: '',
      init: () => '',
      render: () => ''
    };
  }
  return versions[current];
}

function changeReqest(state, action) {
  if (state.request) clearTimeout(state.request);
  return {
    ...state,
    source: action.source,
    request: setTimeout(() => action.dispatch(doAddVersion(action.source)), 1000)
  };
}

function addVersion(state, action) {
  const pastVersions = state.versions.slice(0, state.current + 1);
  const {source, init, render} = action;
  return {
    ...state,
    source,
    request: null,
    versions: [...pastVersions, {source, init, render}],
    current: pastVersions.length
  };
}

function addVersionFailed(state, action) {
  return {
    ...state,
    request: null,
    error: action.error
  };
}

function swapVersion(state, action) {
  if (state.request) clearTimeout(state.request);
  const { source, render } = state.versions[action.idx];
  return {
    ...state,
    source,
    request: null,
    current: action.idx
  };
}

export default function code(state = initialState, action = {}) {
  switch (action.type) {
  case CHANGE_REQUEST: return changeReqest(state, action);
  case ADD_VERSION: return addVersion(state, action);
  case ADD_VERSION_FAILED: return addVersionFailed(state, action);
  case SWAP_VERSION: return swapVersion(state, action);
  default: return state;
  }
}
