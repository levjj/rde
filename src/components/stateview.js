import React, { Component, PropTypes } from 'react';
import stringify from 'json-stringify-pretty-compact';
import AceEditor from 'react-ace/src/ace.jsx';

export default class StateView extends Component {
  static propTypes = {
    currState: PropTypes.any
  }

  onActivate() {
    this.refs.stateace.editor.resize();
  }

  render() {
    const {dom, editable} = this.props;
    return (
      <AceEditor ref="stateace"
                 mode="json"
                 theme="eclipse"
                 name="stateace"
                 height="38vh"
                 width="100%"
                 fontSize={14}
                 readOnly={!editable}
                 value={stringify(this.props.currState)} />);
  }
}
