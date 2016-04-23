import $ from 'jquery';
import _ from 'lodash';

import {event} from './actions/state';
import {stringLitCursor, stringLitInsert, stringLitDelete, firstDifference, strIndexOf} from './actions/manipulation';
import {operators, typeOf, isSymString, convertSymStr} from './symstr';

export const eventKeys = [
  'onabort',
  'onautocomplete',
  'onautocompleteerror',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncontextmenu',
  'oncuechange',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragexit',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onwheel',
  'onpause',
  'onplay',
  'onplaying',
  'onprogress',
  'onratechange',
  'onreset',
  'onseeked',
  'onseeking',
  'onselect',
  'onshow',
  'onsort',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'onvolumechange',
  'onwaiting'];

export const customEventKeys = ['onframe'];

function jsxLocAsStringLitLoc(node) {
  // JSX elements are identifiers, so need to
  // expand loc to left and right for compatibility
  // with normal string literals
  const {loc: {start, end}} = node;
  return {
    start: {
      line: start.line,
      column: start.column - 1
    },
    end: {
      line: end.line,
      column: end.column + 1
    }
  };
}

export function compileJSX(node) {
  if (node.type === 'Literal' && typeOf(node.value) === 'string') {
    const loc = jsxLocAsStringLitLoc(node);
    return {...node, loc, value: node.value.replace(/\s+/g, ' ')};
  }
  if (node.type !== 'JSXElement') return node;
  const name = node.openingElement.name.name;
  const attributes = [];
  for (const attr of node.openingElement.attributes) {
    const attrKeyLoc = jsxLocAsStringLitLoc(attr.name);
    attributes.push({
      key: {type: 'Literal', value: attr.name.name, loc: attrKeyLoc},
      value: attr.value
    });
  }
  const children = node.children.map(compileJSX).filter(n => {
    // drop empty string literals
    return n.type !== 'Literal' ||
           typeOf(n.value) !== 'string' ||
           n.value.length > 0;
  });

  const openingLoc = jsxLocAsStringLitLoc(node.openingElement.name);
  const loc = node.closingElement
    ? {...openingLoc, extra: jsxLocAsStringLitLoc(node.closingElement.name)}
    : openingLoc;
  return {type: 'ObjectExpression', properties: [
    {
      type: 'Property',
      key: {type: 'Identifier', name: 'name'},
      value: {
        type: 'Literal',
        value: name,
        loc
      },
      kind: 'init',
      method: false,
      shorthand: false,
      computed: false
    }, {
      type: 'Property',
      key: {type: 'Identifier', name: 'attributes'},
      value: {type: 'ArrayExpression', elements: attributes.map(({key, value}) => ({type: 'ObjectExpression', properties: [
        {
          type: 'Property',
          key: {type: 'Identifier', name: 'key'},
          value: key,
          kind: 'init',
          method: false,
          shorthand: false,
          computed: false
        }, {
          type: 'Property',
          key: {type: 'Identifier', name: 'value'},
          value,
          kind: 'init',
          method: false,
          shorthand: false,
          computed: false
        }]}))},
      kind: 'init',
      method: false,
      shorthand: false,
      computed: false
    }, {
      type: 'Property',
      key: {type: 'Identifier', name: 'children'},
      value: {type: 'ArrayExpression', elements: children},
      kind: 'init',
      method: false,
      shorthand: false,
      computed: false
    }
  ]};
}

export function wrapHandler(dispatch, func) {
  return function handler() {
    dispatch(event(() => {
      const args = Array.from(arguments).map(convertSymStr);
      func.apply(this, args);
    }));
  };
}

function submitChange(oldStr, newStr) {
  const firstDiff = firstDifference('' + oldStr, newStr);
  const diff = newStr.length - oldStr.length;
  // if adding characters, look up lit of prev char, else current
  const litAt = diff > 0 ? firstDiff - 1 : firstDiff;
  const c = oldStr[litAt];
  if (!isSymString(c)) return false;
  const {id, idx} = c.strs[0];
  if (id > 0) {
    if (diff > 0) {
      const insertStr = newStr.substr(firstDiff, diff);
      return stringLitInsert(id, idx, insertStr);
    } else if (diff < 0) {
      return stringLitDelete(id, idx, -diff);
    }
  }
  return null;
}

function buildEditableSpan(str, dispatch) {
  const elem = $(`<span>${str}</span>`);
  elem.prop('contenteditable', true);
  elem.on('input', () => {
    const action = submitChange(str, elem.text());
    if (!action) {
      elem.text('' + str);
    } else {
      dispatch(action);
    }
  });
  elem.on('focus', () => {
    const c = str[0];
    if (!isSymString(c)) return false;
    dispatch(stringLitCursor(c.strs[0].id));
  });
  elem.on('blur', () => {
    dispatch(stringLitCursor(0));
  });
  return elem;
}

export function build(dom, dispatch, editable) {
  if (typeOf(dom) !== 'object') {
    return editable && isSymString(dom)
           ? buildEditableSpan(dom, dispatch)
           : $(`<span>${dom}</span>`);
  }
  const el = $(`<${dom.name}></${dom.name}>`);
  dom.attributes.forEach(({key, value}) => {
    const sKey = `${key}`;
    if (sKey === 'style' && typeOf(value) === 'object') {
      el.css(value);
    } else if (eventKeys.indexOf(sKey) >= 0) {
      if (!editable) {
        el.on(sKey.substr(2), wrapHandler(dispatch, value));
      }
    } else if (customEventKeys.indexOf(sKey) < 0) {
      el.attr(sKey, value);
    }
  });
  for (const childDom of dom.children) {
    el.append(build(childDom, dispatch, editable));
  }
  return el;
}

function add(...strs) {
  return strs.reduce((res, str) => operators.binary['+'](res, str), '');
}

function formatCSS(obj) {
  return Object.keys(obj).reduce((str, key) => {
    const k = _.snakeCase(key).replace(/_/g, '-');
    return add(str, k, ':', obj[key], ';');
  }, '');
}

export function formatHTML(dom, indent = 0) {
  const pre = ' '.repeat(indent);
  if (typeOf(dom) !== 'object') {
    return add(pre, dom, '\n');
  }
  const attrString = dom.attributes.reduce((str, {key, value}) => {
    const sKey = `${key}`;
    if (sKey === 'style' && typeOf(value) === 'object') {
      return add(str, key, '="', formatCSS(value), '"');
    }
    if (eventKeys.includes(sKey) || customEventKeys.includes(sKey)) {
      return '';
    }
    return add(str, key, '="', value, '"');
  }, '');
  let res = add(pre, '<', dom.name);
  if (attrString.length > 0) {
    res = add(res, ' ', attrString);
  }
  res = add(res, '>\n');
  res = dom.children.reduce((str, childDom) =>
    add(str, formatHTML(childDom, indent + 2)), res);
  return add(res, pre, '</', dom.name, '>\n');
}
