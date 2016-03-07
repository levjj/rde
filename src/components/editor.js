import React, { Component, PropTypes } from 'react';
import { connect } from 'redux/react';

import Ace from './ace';
import { changeReqest } from '../actions/version';

@connect(state => ({
  source: state.version.source,
  highlight: state.version.highlight
}))
export default class Editor extends Component {
  static propTypes = {
    source: PropTypes.string,
    highlight: PropTypes.any,
    showLineNumbers: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired
  }

  onChange(newSource) {
    this.props.dispatch(changeReqest(newSource));
  }

  render() {
    return (
      <Ace mode="jsx"
           name="ace"
           height={68}
           showLineNumbers={this.props.showLineNumbers}
           highlight={this.props.highlight}
           width="100%"
           source={this.props.source}
           onChange={::this.onChange} />
    );
  }
}
