import React, { Component } from 'react';
import Editor from './editor';
import { createRedux, createDispatcher, composeStores } from 'redux';
import { Provider } from 'redux/react';
import * as stores from '../reducers/index';

const store = composeStores(stores);

let redux;
function middleware(getState) { return (next) => (action) => {
  const { promise, types, ...rest } = action;
  action.dispatch = redux.dispatch;
  if (!promise) {
    return next(action);
  }

  const [REQUEST, SUCCESS, FAILURE] = types;
  next({...rest, type: REQUEST});
  return promise(redux.dispatch, getState).then(
    (result) => next({...rest, result, type: SUCCESS}),
    (error) => next({...rest, error, type: FAILURE})
  );
}};

const dispatcher = createDispatcher(store, (getState) => [middleware(getState)]);

redux = createRedux(dispatcher);

export default class App extends Component {
  render() {
    return (
      <Provider redux={redux}>
        {() => <Editor />}
      </Provider>
    );
  }
}
