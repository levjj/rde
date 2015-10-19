import React, { Component } from 'react';
import App from './app';
import { createRedux, createDispatcher, composeStores } from 'redux';
import { Provider } from 'redux/react';
import $ from 'jquery';

import * as stores from '../reducers/index';
import {addVersion} from '../actions/version';
import {frame, reset} from '../actions/state';
import {counter} from '../examples';

const store = composeStores(stores);

let redux;
function middleware(getState) {
  return (next) => (act) => {
    const action = typeof act === 'function'
      ? act(redux.dispatch, getState) : act;
    const { promise, type, types, ...rest } = action;
    if (type) {
      if (type === 'noop') return null;
    }
    action.dispatch = redux.dispatch;
    if (!promise) {
      return next(action);
    }

    const [REQUEST, SUCCESS, FAILURE] = types;
    next({...rest, type: REQUEST});
    return promise.then(
      (result) => next({...rest, result, type: SUCCESS}),
      (error) => next({...rest, error, type: FAILURE})
    );
  };
}

const dispatcher = createDispatcher(store, (getState) => [middleware(getState)]);

redux = createRedux(dispatcher);

const params = (() => {
  const raw = window.location.href.match(/#(.*)$/);
  if (!raw) return {};
  const props = raw[1].split(/,/);
  const src = props.reduce((acc, p) => acc || p.startsWith('src=') && p, false);
  return {
    src: src && decodeURIComponent(src.split(/=/)[1]),
    isDemo: props.indexOf('demo') >= 0,
    hideTime: props.indexOf('notime') >= 0
  };
})();

export default class Redux extends Component {

  componentWillMount() {
    if (params.isDemo) {
      $('#banner').remove();
    }
    redux.dispatch(addVersion(params.src || counter));
    redux.dispatch(reset());
  }

  componentDidMount() {
    setInterval(() => redux.dispatch(frame()), 25);
  }

  render() {
    return (
      <Provider redux={redux}>
        {() => <App isDemo={params.isDemo}
                    showTimeControl={!params.hideTime} />}
      </Provider>
    );
  }
}
