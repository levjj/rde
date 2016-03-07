import React, { Component, PropTypes } from 'react';
import $ from 'jquery';
import { connect } from 'redux/react';

import {build} from '../builder';
import {typeOf} from '../symstr';

@connect(state => ({
  dom: state.state.dom,
  isActive: state.state.isActive
}))
export default class LiveView extends Component {
  static propTypes = {
    dom: PropTypes.any,
    isActive: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired
  }

  componentDidMount() {
    const view = React.findDOMNode(this.refs.view);
    $(view).empty();
    $(view).append(build(this.props.dom, this.props.dispatch));
  }

  shouldComponentUpdate(nextProps) {
    function rec(left, right) {
      if (typeOf(left) !== typeOf(right)) return true;
      if (typeOf(left) === 'string') return `${left}` !== `${right}`;
      if (typeOf(left) !== 'object') return left !== right;
      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) return true;
      for (let i = 0; i < leftKeys.length; i++) {
        const key = leftKeys[i];
        if (key !== rightKeys[i]) return true;
        if (rec(left[key], right[key])) return true;
      }
      return false;
    }
    return this.props.isActive !== nextProps.isActive ||
           rec(this.props.dom, nextProps.dom);
  }

  componentWillUpdate() {
    const view = React.findDOMNode(this.refs.view);
    $(view).empty();
  }

  componentDidUpdate() {
    const view = React.findDOMNode(this.refs.view);
    const {dom, isActive, dispatch} = this.props;
    $(view).append(build(dom, dispatch, !isActive));
  }

  render() {
    return (
      <div ref="view" />
    );
  }
}
