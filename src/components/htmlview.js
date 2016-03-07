import React, {Component, PropTypes} from 'react';
import {connect} from 'redux/react';

import Ace from './ace';
import {isSymString} from '../symstr';
import {stringLitCursor, stringLitInsert, stringLitDelete, firstDifference, strIndexOf} from '../actions/manipulation';

@connect(state => ({
  htmlstr: state.state.htmlstr,
  isActive: state.state.isActive
}))
export default class HTMLView extends Component {
  static propTypes = {
    htmlstr: PropTypes.any,
    isActive: PropTypes.bool.isRequired,
    active: PropTypes.bool.isRequired,
    editable: PropTypes.bool,
    dispatch: PropTypes.func.isRequired
  }

  componentDidMount() {
    window.htmlview = this;
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
    const firstDiff = firstDifference('' + this.props.htmlstr, newSource);
    const diff = newSource.length - this.props.htmlstr.length;
    // if adding characters, look up lit of prev char, else current
    const litAt = diff > 0 ? firstDiff - 1 : firstDiff;
    const lit = this.getStrLitAtPos(litAt);
    if (lit && lit.id > 0) {
      const {id, idx} = lit;
      if (diff > 0) {
        const insertStr = newSource.substr(firstDiff, diff);
        this.props.dispatch(stringLitInsert(id, idx, insertStr));
      } else if (diff < 0) {
        this.props.dispatch(stringLitDelete(id, idx, -diff));
      }
    } else {
      this.refs.htmlace.dropEdit();
    }
  }

  onChangeSelection(selection) {
    const {row, column} = selection.start;
    const htmlidx = strIndexOf(this.props.htmlstr, row, Math.max(0, column - 1));
    const lit = this.getStrLitAtPos(htmlidx);
    if (lit) {
      this.props.dispatch(stringLitCursor(lit.id));
    }
  }

  getStrLitAtPos(htmlidx) {
    const c = this.props.htmlstr[htmlidx];
    if (isSymString(c)) {
      return c.strs[0];
    }
    return null;
  }

  render() {
    const {htmlstr, isActive} = this.props;
    return (
      <Ace ref="htmlace"
           readOnly={isActive}
           mode="html"
           name="htmlace"
           height={38}
           onChange={::this.onChange}
           onChangeSelection={::this.onChangeSelection}
           source={`${htmlstr}`} />);
  }
}
