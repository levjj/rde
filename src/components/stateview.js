import React, { Component, PropTypes } from 'react';
import stringify from 'json-stringify-pretty-compact';

export default class StateView extends Component {
  static propTypes = {
    currState: PropTypes.any
  }

  render() {
    return (
      <pre style={{height: '38vh', width: '100%'}}>
        {stringify(this.props.currState)}
      </pre>
    );
  }
}
