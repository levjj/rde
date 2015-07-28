import {
  HOT_REQUEST,
  HOT_SWAP,
  HOT_SWAP_SUCCESS,
  HOT_SWAP_FAILED
} from './action_types';

export function hotReqest(source) {
  return {
    type: HOT_REQUEST,
    source: source
  }
}

function parse(src) {
  return src.split('');
}

function rewrite(src) {
  return src.filter(x => x === 'a');
}

function setup(src) {
  return src.length;
}

export function hotSwap() {
  return {
    types: [HOT_SWAP, HOT_SWAP_SUCCESS, HOT_SWAP_FAILED],
    promise: (dispatch, getState) =>
      Promise.resolve(getState().code.source)
             .then(parse)
             .then(rewrite)
             .then(setup)
  };
}
