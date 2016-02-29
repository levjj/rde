let unary;
let binary;

function wrap(x) {
  return new Proxy(x, {
    get: (target, key) => {
      if (+key >= 0 && +key < target.length) {
        return target.charAt(+key);
      }
      if (key === Symbol.iterator) {
        const chars = [];
        for (let i = 0; i < target.length; i++) {
          chars.push(target.charAt(i));
        }
        return chars[Symbol.iterator];
      }
      return target[key];
    },
    set: (target, key, value) => value,
    deleteProperty: () => true,
    getPrototypeOf: () => String.prototype, // FIXME: Needs to wrapped
    getOwnPropertyDescriptor: (target, prop) => {
      if (+prop < 0 || +prop >= target.length) {
        return undefined;
      }
      return {
        value: target.charAt(+prop),
        writable: false,
        enumerable: true,
        configurable: false
      };
    },
    defineProperty: () => { throw new TypeError('defineProperty invalid'); },
    has: () => { throw new TypeError('cannot use \'in\' operator'); },
    ownKeys: (target) => {
      const keys = [];
      for (let i = 0; i < target.length; i++) {
        keys.push('' + i);
      }
      return keys;
    },
    enumerate: function enumerate(target) {
      return this.ownKeys(target)[Symbol.iterator]();
    }
  });
}

// String which track origin information ID
export class SymString {

  constructor(parts) {
    const [lst, len] = parts.reduce(([list, start], {str, id, idx}) => {
      return [[...list, {str, id, idx, start}], start + str.length];
    }, [[], 0]);
    this.strs = lst;
    this.length = len;
  }

  add(other) {
    return SymString.create([...this.strs, ...other.strs]);
  }

  toSourceString() {
    return this.strs.reduce((res, {str}) => res + str, '');
  }

  mapParts(f) {
    return SymString.create(this.strs.map(({str, id, idx, start}) => {
      return {str: f(str), id, idx, start};
    }));
  }

  // String methods

  charAt(i) {
    if (i < 0) return '';
    const group = this.strs.find(({str, start}) => start + str.length > i);
    if (group === undefined) return '';
    const localIdx = i - group.start;
    return SymString.single(group.str[localIdx], group.id, group.idx + localIdx);
  }

  charCodeAt(index) {
    // Returns a number indicating the Unicode value of the character at the given index.
    return this.toSourceString().charCodeAt(index);
  }

  codePointAt(pos) {
    // Returns a non-negative integer that is the UTF-16 encoded code point value at the given position.
    return this.toSourceString().codePointAt(pos);
  }

  concat(...strs) {
    // Combines the text of two strings and returns a new string.
    const add = binary['+'];
    return strs.reduce((res, str) => add(res, str), this);
  }

  includes(searchStr, pos) {
    // Determines whether one string may be found within another string.
    return this.toSourceString().includes(searchStr, pos);
  }

  endsWith(searchStr, pos) {
    // Determines whether a string ends with the characters of another string.
    return this.toSourceString().endsWith(searchStr, pos);
  }

  indexOf(searchStr, pos) {
    // Returns the index within the calling String object of the first occurrence of the specified value, or -1 if not found.
    return this.toSourceString().indexOf(searchStr, pos);
  }

  lastIndexOf(searchStr, pos) {
    // Returns the index within the calling String object of the last occurrence of the specified value, or -1 if not found.
    return this.toSourceString().lastIndexOf(searchStr, pos);
  }

  localeCompare(compareString, locales, options) {
    // Returns a number indicating whether a reference string comes before or after or is the same as the given string in sort order.
    return this.toSourceString().localeCompare(compareString, locales, options);
  }

  match(regexp) {
    // Used to match a regular expression against a string.
    return this.toSourceString().match(regexp);
  }

  normalize(form) {
    // Returns the Unicode Normalization Form of the calling string value.
    return this.mapParts(p => p.normalize(form));
  }

  quote() {
    // Wraps the string in double quotes (""").
    const add = binary['+'];
    return add(add('"', this), '"');
  }

  repeat(count) {
    // Returns a string consisting of the elements of the object repeated the given times.
    const add = binary['+'];
    let result = '';
    for (let i = 0; i < count; i++) {
      result = add(result, this);
    }
    return result;
  }

  replace(substr, newSubStr) {
    const str = this.toSourceString();
    const add = binary['+'];
    const typeo = unary.typeof;
    const replacement = typeof newSubStr === 'function'
      ? newSubStr()
      : newSubStr;
    let indices = [];
    if (typeo(substr) === 'string') {
      const idx = str.indexOf(substr);
      if (idx >= 0) indices = [{index: idx, length: substr.length}];
    } else if (substr instanceof RegExp) {
      indices = [];
      let res = substr.exec(str);
      while (res) {
        indices.push({index: res.index, length: res[0].length});
        res = substr.exec(str);
      }
    }
    let result = '';
    let prevIdx = 0;
    for (const {index, length} of indices) {
      result = add(result, this.substring(prevIdx, index));
      result = add(result, replacement);
      prevIdx = index + length;
    }
    const lastIdx = indices.length - 1;
    const last = lastIdx >= 0
      ? indices[lastIdx].index + indices[lastIdx].length
      : 0;
    return add(result, this.substr(last));
  }

  search(regexp) {
    // Executes the search for a match between a regular expression and a specified string.
    return this.toSourceString().search(regexp);
  }

  slice(beginSlice, endSlice) {
    // Extracts a section of a string and returns a new string.
    return this.substring(beginSlice, endSlice);
    // FIXME: small differences
  }

  split(separator, limit) {
    // Splits a String object into an array of strings by separating the string into substrings.
    const str = this.toSourceString();
    const typeo = unary.typeof;
    let indices = [];
    if (typeo(separator) === 'string') {
      const idx = str.indexOf(separator);
      if (idx >= 0) indices = [{index: idx, length: separator.length}];
    } else if (separator instanceof RegExp) {
      indices = [];
      let res = separator.exec(str);
      while (separator.exec(str)) {
        indices.push({index: res.index, length: res[0].length});
        res = separator.exec(str);
      }
    }
    const result = [];
    let prevIdx = 0;
    for (const {index, length} of indices) {
      result.push(this.substring(prevIdx, index));
      prevIdx = index + length;
    }
    const lastIdx = indices.length - 1;
    const last = lastIdx >= 0
      ? indices[lastIdx].index + indices[lastIdx].length
      : 0;
    result.push(this.substr(last));
    return result.slice(0, limit);
  }

  startsWith(searchStr, pos) {
    // Determines whether a string begins with the characters of another string.
    return this.toSourceString().startsWith(searchStr, pos);
  }

  substr(start, length = this.length - start) {
    // Returns the characters in a string beginning at the specified location through the specified number of characters.
    return this.substring(start, start + length);
  }

  substring(startIdx, endIdx = this.length) {
    // Returns the characters in a string between two indexes into the string.
    const startGroup = this.strs.findIndex(({str, start}) => start + str.length > startIdx);
    if (startGroup === -1) return '';
    const parts = [];
    for (let i = startGroup; i < this.strs.length; i++) {
      const {str, id, idx, start} = this.strs[i];
      const from = Math.max(0, startIdx - start);
      const to = Math.max(0, endIdx - start);
      const sstr = str.substring(from, to);
      if (sstr.length > 0) {
        parts.push({
          str: sstr,
          id,
          idx: idx + from
        });
      }
    }
    return SymString.create(parts);
  }

  toLocaleLowerCase() {
    // The characters within a string are converted to lower case while respecting the current locale. For most languages, this will return the same as toLowerCase().
    return this.mapParts(p => p.toLocaleLowerCase());
  }

  toLocaleUpperCase() {
    // The characters within a string are converted to upper case while respecting the current locale. For most languages, this will return the same as toUpperCase().
    return this.mapParts(p => p.toLocaleUpperCase());
  }

  toLowerCase() {
    // Returns the calling string value converted to lower case.
    return this.mapParts(p => p.toLowerCase());
  }

  toSource() {
    // Returns an object literal representing the specified object; you can use this value to create a new object. Overrides the Object.prototype.toSource() method.
    return this.toSourceString().toSource();
  }

  toString() {
    // Returns a string representing the specified object. Overrides the Object.prototype.toString() method.
    return SymString.create(this.strs);
  }

  toUpperCase() {
    // Returns the calling string value converted to uppercase.
    return this.mapParts(p => p.toUpperCase());
  }

  trim() {
    // Trims whitespace from the beginning and end of the string. Part of the ECMAScript 5 standard.
    return this.trimRight().trimLeft();
  }

  trimLeft() {
    // Trims whitespace from the left side of the string.
    const ws = this.match(/^\s+/).length;
    return this.substr(ws);
  }

  trimRight() {
    // Trims whitespace from the right side of the string.
    const ws = this.match(/\s+$/).length;
    return this.substr(0, this.length - ws);
  }

  valueOf() {
    // Returns the primitive value of the specified object. Overrides the Object.prototype.valueOf() method.
    return SymString.create(this.strs);
  }

  anchor(name) {
    // <a name="name"> (hypertext target)
    const add = binary['+'];
    return add(add(add(add('<a name="', name), '">'), this), '</a>');
  }

  big() {
    // <big>
    const add = binary['+'];
    return add(add('<big>', this), '</big>');
  }

  blink() {
    // <blink>
    const add = binary['+'];
    return add(add('<blink>', this), '</blink>');
  }

  bold() {
    // <b>
    const add = binary['+'];
    return add(add('<b>', this), '</b>');
  }

  fixed() {
    // <tt>
    const add = binary['+'];
    return add(add('<tt>', this), '</tt>');
  }

  fontcolor(color) {
    // <font color="color">
    const add = binary['+'];
    return add(add(`<font color="${color}">`, this), '</font>');
  }

  fontsize(size) {
    // <font size="size">
    const add = binary['+'];
    return add(add(`<font size="${size}">`, this), '</font>');
  }

  italics() {
    // <i>
    const add = binary['+'];
    return add(add('<i>', this), '</i>');
  }

  link(url) {
    // <a href="rul"> (link to URL)
    const add = binary['+'];
    return add(add(add(add('<a href="', url), '">'), this), '</a>');
  }

  small() {
    // <small>
    const add = binary['+'];
    return add(add('<small>', this), '</small>');
  }

  strike() {
    // <strike>
    const add = binary['+'];
    return add(add('<strike>', this), '</strike>');
  }

  sub() {
    // <sub>
    const add = binary['+'];
    return add(add('<sub>', this), '</sub>');
  }

  sup() {
    // <sup>
    const add = binary['+'];
    return add(add('<sup>', this), '</sup>');
  }

  static single(s, id = 0, idx = 0) {
    const str = String(s);
    if (str.length === 0) return '';
    return wrap(new SymString([{str, id, idx}]));
  }

  static create(parts) {
    if (parts.length === 0) return '';
    return wrap(new SymString(parts));
  }
}

function sym(val) {
  if (val instanceof SymString) {
    return val;
  }
  return SymString.single(val);
}

unary = {
  '-': (op) => {
    if (op instanceof SymString) {
      return +op.toSourceString();
    }
    return -op;
  },
  '+': (op) => {
    if (op instanceof SymString) {
      return +op.toSourceString();
    }
    return +op;
  },
  '!': (op) => {
    if (op instanceof SymString) {
      return false;
    }
    return !op;
  },
  '~': (op) => {
    if (op instanceof SymString) {
      return -1;
    }
    return ~op;
  },
  'typeof': (op) => {
    if (op instanceof SymString) {
      return 'string';
    }
    return typeof op;
  },
  'void': (o) => void(o)
  // do not rewrite: delete
};

binary = {
  '==': (l, r) => {
    /* eslint eqeqeq:0 */
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left == right;
  },
  '!=': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left != right;
  },
  '===': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left === right;
  },
  '!==': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left !== right;
  },
  '<': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left < right;
  },
  '<=': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left <= right;
  },
  '>': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left > right;
  },
  '>=': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left >= right;
  },
  '<<': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left << right;
  },
  '>>': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left >> right;
  },
  '>>>': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left >>> right;
  },
  '+': (left, right) => {
    if (left instanceof SymString ||
        right instanceof SymString) {
      const leftSym = sym(left);
      const rightSym = sym(right);
      if (!(leftSym instanceof SymString)) return rightSym;
      if (!(rightSym instanceof SymString)) return leftSym;
      return leftSym.add(rightSym);
    }
    return left + right;
  },
  '-': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left - right;
  },
  '*': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left * right;
  },
  '/': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left / right;
  },
  '%': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left % right;
  },
  '|': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left | right;
  },
  '^': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left ^ right;
  },
  '&': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left & right;
  },
  'in': (l, r) => {
    const left = l instanceof SymString ? l.toSourceString() : l;
    const right = r instanceof SymString ? r.toSourceString() : r;
    return left in right;
  },
  'instanceof': (obj, clz) => {
    if (obj instanceof SymString && clz === String) {
      return true;
    }
    return obj instanceof clz;
  }
};

export const operators = { unary, binary };
