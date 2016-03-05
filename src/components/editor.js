import React, { Component, PropTypes } from 'react';
import { connect } from 'redux/react';
import AceEditor from 'react-ace/src/ace.jsx';

require('brace/mode/jsx');
require('brace/mode/html');
require('brace/mode/json');
require('brace/theme/eclipse');

import { changeReqest } from '../actions/version';

@connect(state => ({
  source: state.version.source
}))
export default class Editor extends Component {
  static propTypes = {
    source: PropTypes.string,
    showLineNumbers: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired
  }

  componentDidMount() {
    this.hasMounted = true;
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.source !== this.props.source;
  }

  componentWillUpdate() {
    this.hasMounted = false;
  }

  componentDidUpdate() {
    this.hasMounted = true;
  }

  onChange(newSource) {
    if (this.hasMounted && newSource !== this.props.source) {
      this.props.dispatch(changeReqest(newSource));
    }
  }

  onAceLoad(editor) {
    editor.getSession().setTabSize(2);
    editor.renderer.setShowGutter(this.props.showLineNumbers);
  }

  render() {
    return (
      <AceEditor mode="jsx"
                 theme="eclipse"
                 name="ace"
                 height="68vh"
                 width="100%"
                 fontSize={14}
                 value={this.props.source}
                 onChange={::this.onChange}
                 onLoad={::this.onAceLoad} />
    );
  }
}
