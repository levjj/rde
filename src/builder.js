import $ from 'jquery';

import {event} from './actions/state';
import {typeOf} from './symstr';

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

export const customEventKeys = [
  'onframe'];

export function compileJSX(node) {
  if (node.type === 'Literal' && typeOf(node.value) === 'string') {
    return {...node, value: node.value.trim()};
  }
  if (node.type !== 'JSXElement') return node;
  const name = node.openingElement.name.name;
  const attributes = [];
  for (const attr of node.openingElement.attributes) {
    attributes.push({
      key: attr.name.name,
      value: attr.value
    });
  }
  const children = node.children.map(compileJSX).filter(n => {
    // drop empty string literals
    return n.type !== 'Literal' ||
           typeOf(n.value) !== 'string' ||
           n.value.length > 0;
  });
  return {type: 'ObjectExpression', properties: [
    {
      type: 'Property',
      key: {type: 'Identifier', name: 'name'},
      value: {type: 'Literal', value: name},
      kind: 'init',
      method: false,
      shorthand: false,
      computed: false
    }, {
      type: 'Property',
      key: {type: 'Identifier', name: 'attributes'},
      value: {type: 'ObjectExpression', properties: attributes.map(({key, value}) => ({
        type: 'Property',
        key: {type: 'Identifier', name: key},
        value,
        kind: 'init',
        method: false,
        shorthand: false,
        computed: false
      }))},
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
    dispatch(event(() => func.apply(this, arguments)));
  };
}

export function build(dom, dispatch) {
  if (typeOf(dom) !== 'object') {
    return $(`<span>${dom}</span>`);
  }
  const el = $(`<${dom.name}></${dom.name}>`);
  Object.keys(dom.attributes).forEach((key) => {
    const value = dom.attributes[key];
    if (key === 'style' && typeOf(value) === 'object') {
      el.css(value);
    } else if (eventKeys.indexOf(key) >= 0) {
      el.on(key.substr(2), wrapHandler(dispatch, value));
    } else if (customEventKeys.indexOf(key) < 0) {
      el.attr(key, value);
    }
  });
  for (const childDom of dom.children) {
    el.append(build(childDom, dispatch));
  }
  return el;
}
