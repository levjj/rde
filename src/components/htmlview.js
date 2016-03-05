import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import AceEditor from 'react-ace/src/ace.jsx';

import {eventKeys, customEventKeys} from '../builder';
import {typeOf} from '../symstr';
import {stringLitCursor} from '../actions/manipulation';

export default class HTMLView extends Component {
  static propTypes = {
    dom: PropTypes.any,
    editable: PropTypes.bool,
    dispatch: PropTypes.func.isRequired
  }

  shouldComponentUpdate(nextProps) {
    function rec(left, right) {
      if (typeOf(left) !== typeOf(right)) return true;
      if (typeOf(left) !== 'object') return left === right;
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

  onActivate() {
    this.refs.htmlace.editor.resize();
    // TODO:
    // editor.onSelect (idx) => dispatch(stringLitCursor(idx))
  }

  formatCSS(obj) {
    return Object.keys(obj).map(key => {
      const k = _.snakeCase(key).replace(/_/g, '-');
      return `${k}:${obj[key]};`;
    }).join(' ');
  }

  formatHTML(dom, indent = 0) {
    const pre = ' '.repeat(indent);
    if (typeOf(dom) !== 'object') {
      return `${pre}${dom}\n`;
    }
    const attrString = Object.keys(dom.attributes).map(key => {
      let value = dom.attributes[key];
      if (key === 'style' && typeOf(value) === 'object') {
        value = this.formatCSS(value);
      }
      if (eventKeys.includes(key) || customEventKeys.includes(key)) {
        return '';
      }
      return ` ${key}=\"${value}\"`;
    }).join('');
    let res = `${pre}<${dom.name}${attrString}>\n`;
    for (const childDom of dom.children) {
      res += this.formatHTML(childDom, indent + 2);
    }
    res += `${pre}</${dom.name}>\n`;
    return res;
  }

  render() {
    const {dom, editable} = this.props;
    return (
      <AceEditor ref="htmlace"
                 mode="html"
                 theme="eclipse"
                 name="htmlace"
                 height="38vh"
                 width="100%"
                 fontSize={14}
                 readOnly={!editable}
                 value={this.formatHTML(dom)} />);
  }
}
