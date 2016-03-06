import {
  STRING_LIT_CURSOR,
  CHANGE_REQUEST
} from './types';

import {currentVersion} from '../reducers/version';

export function strIndexOf(str, row, column) {
  const parts = `${str}`.split('\n');
  let idx = 0;
  for (let i = 0; i < row; i++) {
    idx += parts[i].length + 1;
  }
  return idx + column;
}

export function stringLitCursor(id, idx) {
  return {
    type: STRING_LIT_CURSOR,
    id,
    idx
  };
}

export function stringLitInsert(id, idx, insertStr) {
  return (dispatch, getState) => {
    const {source, mapping} = currentVersion(getState());
    const {line, column} = mapping[id].start;
    const startIdx = strIndexOf(source, line - 1, column + idx);
    const newSource = source.substr(0, startIdx) + insertStr + source.substr(startIdx);
    return {
      type: CHANGE_REQUEST,
      source: newSource
    };
  };
}

export function stringLitDelete(id, idx, delLength) {
  return (dispatch, getState) => {
    const {source, mapping} = currentVersion(getState());
    const {line, column} = mapping[id].start;
    const startIdx = strIndexOf(source, line - 1, column + idx);
    const newSource = source.substr(0, startIdx) + source.substr(startIdx + delLength);
    return {
      type: CHANGE_REQUEST,
      source: newSource
    };
  };
}
