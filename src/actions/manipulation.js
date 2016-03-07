import {
  STRING_LIT_CURSOR
} from './types';

import {changeReqest} from './version';

import {currentVersion} from '../reducers/version';

export function strIndexOf(str, row, column) {
  const parts = `${str}`.split('\n');
  let idx = 0;
  for (let i = 0; i < row; i++) {
    idx += parts[i].length + 1;
  }
  return idx + column;
}

export function firstDifference(strA, strB) {
  const lim = Math.min(strA.length, strB.length);
  for (let i = 0; i < lim; i++) {
    if (strA[i] !== strB[i]) return i;
  }
  return lim;
}

export function stringLitCursor(id) {
  return {
    type: STRING_LIT_CURSOR,
    id
  };
}

function findStartIdx(state, id, idx) {
  const {source, mapping} = currentVersion(state);
  const {line, column} = mapping[id].start;
  const sIdx = strIndexOf(source, line - 1, column + idx) + 1;
  if (mapping[id].extra) {
    const start = mapping[id].extra.start;
    const eIdx = strIndexOf(source, start.line - 1, start.column + idx) + 1;
    return [sIdx, eIdx];
  }
  return [sIdx];
}

export function stringLitInsert(id, idx, insertStr) {
  return (dispatch, getState) => {
    const startIdxs = findStartIdx(getState(), id, idx);
    const {source} = currentVersion(getState());
    let newSource = source;
    let adapt = 1;
    for (const startIdx of startIdxs) {
      newSource = newSource.substr(0, startIdx + adapt) + insertStr + newSource.substr(startIdx + adapt);
      adapt += insertStr.length;
    }
    return changeReqest(newSource);
  };
}

export function stringLitDelete(id, idx, delLength) {
  return (dispatch, getState) => {
    const startIdxs = findStartIdx(getState(), id, idx);
    const {source} = currentVersion(getState());
    let newSource = source;
    let adapt = 0;
    for (const startIdx of startIdxs) {
      newSource = newSource.substr(0, startIdx + adapt) + newSource.substr(startIdx + adapt + delLength);
      adapt -= delLength;
    }
    return changeReqest(newSource);
  };
}
