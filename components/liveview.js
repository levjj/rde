import React, { Component, PropTypes } from 'react';
import $ from 'jquery';

export default class LiveView extends Component {
  static propTypes = {
    dom: PropTypes.any
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
    $(view).append(this.props.dom);
  }

  render() {
    return (
      <div ref="view" />
    );
  }
}
