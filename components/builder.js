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
      let frameHandlers = [];
      if (typeof opts === 'object' && !(opts instanceof $)) {
        if (opts.id) el.attr('id', opts.id);
        if (opts.type) el.attr('type', opts.type);
        if (opts.class) el.addClass(opts.class);
        if (opts.height) el.height(opts.height);
        if (opts.width) el.width(opts.width);
        if (opts.background) {
          el.css('background-repeat', 'repeat');
          el.css('background-image', `url(${opts.background.url})`);
          el.css('background-position',
              `${opts.background.x || 0}px ${opts.background.y || 0}px`);
        }
        if (opts.x) {
          el.css('position', 'relative');
          el.css('left', opts.x);
        }
        if (opts.y) {
          el.css('position', 'relative');
          el.css('top', opts.y);
        }
        if (opts.onclick) {
          el.on('mousedown', wrapHandler(dispatch, opts.onclick));
        }
        if (opts.onframe) {
          frameHandlers.push(opts.onframe);
        }
      }
      for (let i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'string') {
          el.append($('<span></span>').text(arguments[i]));
        } else if (arguments[i] instanceof $) {
          frameHandlers = frameHandlers.concat(
              arguments[i].data('frame-handlers'));
          el.append(arguments[i]);
        }
      }
      el.data('frame-handlers', frameHandlers);
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
