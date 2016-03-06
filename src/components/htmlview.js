import React, {Component, PropTypes} from 'react';
import {connect} from 'redux/react';

import Ace from './ace';
import {isSymString} from '../symstr';
import {stringLitCursor} from '../actions/manipulation';

@connect(state => ({
  htmlstr: state.state.htmlstr
}))
export default class HTMLView extends Component {
  static propTypes = {
    htmlstr: PropTypes.any,
    active: PropTypes.bool.isRequired,
    editable: PropTypes.bool,
    dispatch: PropTypes.func.isRequired
  }

  shouldComponentUpdate(nextProps) {
    return this.props.active || nextProps.active;
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.active && this.props.active) {
      this.refs.htmlace.repaint();
    }
  }

  onChangeSelection(selection) {
    const {row, column} = selection.start;
    const htmlidx = this.strIndexOf(row, column);
    const c = this.props.htmlstr[htmlidx];
    if (isSymString(c)) {
      const {id, idx} = c.strs[0];
      this.props.dispatch(stringLitCursor(id, idx));
    }
  }

  strIndexOf(row, column) {
    const parts = `${this.props.htmlstr}`.split('\n');
    let idx = 0;
    for (let i = 0; i < row; i++) {
      idx += parts[i].length + 1;
    }
    return idx + column;
  }

  render() {
    const {htmlstr} = this.props;
    return (
      <Ace ref="htmlace"
           mode="html"
           name="htmlace"
           height={38}
           onChangeSelection={::this.onChangeSelection}
           source={`${htmlstr}`} />);
  }
}
