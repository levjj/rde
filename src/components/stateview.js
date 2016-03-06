import React, { Component, PropTypes } from 'react';
import stringify from 'json-stringify-pretty-compact';
import { connect } from 'redux/react';

import Ace from './ace';
import strategy from '../strategy';

@connect(state => ({
  currState: strategy.current(state)}))
export default class StateView extends Component {
  static propTypes = {
    currState: PropTypes.any,
    active: PropTypes.bool.isRequired
  }

  shouldComponentUpdate(nextProps) {
    return this.props.active || nextProps.active;
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.active && this.props.active) {
      this.refs.stateace.repaint();
    }
  }

  render() {
    const {currState} = this.props;
    return (
      <Ace ref="stateace"
           mode="json"
           name="stateace"
           height={38}
           source={stringify(currState)} />);
  }
}
