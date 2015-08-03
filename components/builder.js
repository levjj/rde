import $ from 'jquery';
import clone from 'clone';

import {event} from '../actions/state';

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

export default function builder(dispatch) {
  function build(tag) {
    return function b(opts) {
      const el = $(`<${tag}></${tag}>`);
      if (typeof opts === 'object' && !(opts instanceof $)) {
        if (opts.id) el.attr('id', opts.id);
        if (opts.type) el.attr('type', opts.type);
        if (opts.class) el.addClass(opts.class);
        if (opts.onclick) {
          el.on('click', wrapHandler(dispatch, opts.onclick));
        }
      }
      for (let i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'string') {
          el.append($('<span></span>').text(arguments[i]));
        } else if (arguments[i] instanceof $) {
          el.append(arguments[i]);
        }
      }
      return el;
    };
  }
  return {
    p: build('p'),
    span: build('span'),
    h1: build('h1'),
    div: build('div'),
    input: build('input'),
    button: build('button')
  };
}
