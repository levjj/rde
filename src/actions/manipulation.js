import {
  STRING_LIT_CURSOR,
  STRING_LIT_INSERT
} from './types';

export function stringLitCursor(id, idx) {
  return {
    type: STRING_LIT_CURSOR,
    id,
    idx
  };
}
