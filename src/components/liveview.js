import React, { Component, PropTypes } from 'react';
import $ from 'jquery';

import {build} from '../builder';

export default class LiveView extends Component {
  static propTypes = {
    dom: PropTypes.any,
    dispatch: PropTypes.func.isRequired
  }

  componentDidMount() {
    const view = React.findDOMNode(this.refs.view);
    $(view).empty();
    $(view).append(this.props.dom);
  }

  shouldComponentUpdate(nextProps) {
    function rec(left, right) {
      if (typeof left !== typeof right) return true;
      if (typeof left !== 'object') return left === right;
      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) return true;
      for (let i = 0; i < leftKeys.length; i++) {
        const key = leftKeys[i];
        if (key !== rightKeys[i]) return true;
        if (rec(left[key], right[key])) return true;
      }
    }
    return rec(this.props.dom, nextProps.dom);
  }

  componentWillUpdate() {
    const view = React.findDOMNode(this.refs.view);
    $(view).empty();
  }

  componentDidUpdate() {
    const view = React.findDOMNode(this.refs.view);
    $(view).append(build(this.props.dom, this.props.dispatch));
  }

  render() {
    return (
      <div ref="view" />
    );
  }
}
