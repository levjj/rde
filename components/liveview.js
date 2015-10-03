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
