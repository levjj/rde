import $ from 'jquery';
import clone from 'clone';

import {event} from './actions/state';

const eventKeys = [
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

export function compileJSX(node) {
  if (node.type !== 'JSXElement') return node;
  const name = node.openingElement.name.name;
  const attributes = [];
  for (const attr of node.openingElement.attributes) {
    attributes.push({
      key: attr.name.name,
      value: attr.value
    });
  }
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
      value: {type: 'ArrayExpression', elements: node.children.map(compileJSX)},
      kind: 'init',
      method: false,
      shorthand: false,
      computed: false
    }
  ]};
}

function wrapHandler(dispatch, func) {
  return function handler() {
    try {
      window.state = clone(window.state);
      return func.apply(this, arguments);
    } finally {
      dispatch(event());
    }
  };
}

export function build(dom, dispatch) {
  if (typeof dom !== 'object') {
    return $(`<span>${dom}</span>`);
  }
  const el = $(`<${dom.name}></${dom.name}>`);
  Object.keys(dom.attributes).forEach((key) => {
    const value = dom.attributes[key];
    if (key === 'style' && typeof value === 'object') {
      el.css(value);
    } else if (eventKeys.indexOf(key) >= 0) {
      el.on(key.substr(2), wrapHandler(dispatch, value));
    } else {
      el.attr(key, value);
    }
  });
  for (const childDom of dom.children) {
    el.append(build(childDom, dispatch));
  }
  return el;
}
