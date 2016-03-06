import React, {Component, PropTypes} from 'react';
import {connect} from 'redux/react';

import Ace from './ace';
import {isSymString} from '../symstr';
import {stringLitCursor, stringLitInsert, stringLitDelete} from '../actions/manipulation';

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

  onChange(newSource) {
    const firstDiff = this.firstDifference('' + this.props.htmlstr, newSource);
    const lit = this.getStrLitAtPos(firstDiff);
    const diff = newSource.length > this.props.htmlstr.length;
    if (lit && lit.id > 0) {
      const {id, idx} = lit;
      if (diff > 0) {
        const insertStr = newSource.substr(firstDiff, diff);
        // this.props.dispatch(stringLitInsert(id, idx, insertStr));
      } else if (diff < 0) {
        // this.props.dispatch(stringLitDelete(id, idx, -diff));
      }
    } else {
      // this.refs.htmlace.dropEdit();
    }
  }

  onChangeSelection(selection) {
    const {row, column} = selection.start;
    const htmlidx = this.strIndexOf(row, column);
    const lit = this.getStrLitAtPos(htmlidx);
    if (lit) {
      this.props.dispatch(stringLitCursor(lit.id, lit.idx));
    }
  }

  getStrLitAtPos(htmlidx) {
    const c = this.props.htmlstr[htmlidx];
    if (isSymString(c)) {
      return c.strs[0];
    }
    return null;
  }

  firstDifference(strA, strB) {
    const lim = Math.min(strA.length, strB.length);
    for (let i = 0; i < lim; i++) {
      if (strA[i] !== strB[i]) return i;
    }
    return lim;
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
           onChange={::this.onChange}
           onChangeSelection={::this.onChangeSelection}
           source={`${htmlstr}`} />);
  }
}
