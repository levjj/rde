import React, { Component, PropTypes } from 'react';
import AceEditor from 'react-ace/src/ace.jsx';

require('brace/mode/jsx');
require('brace/mode/html');
require('brace/mode/json');
require('brace/theme/eclipse');

export default class Ace extends Component {
  static propTypes = {
    name: PropTypes.string,
    mode: PropTypes.string,
    source: PropTypes.string,
    highlight: PropTypes.any,
    height: PropTypes.number,
    showLineNumbers: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onChangeSelection: PropTypes.func
  }

  componentDidMount() {
    this.hasMounted = true;
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.readOnly !== this.props.readOnly ||
      `${nextProps.source}` !== `${this.props.source}` ||
      !this.locEqual(nextProps.highlight, this.props.highlight);
  }

  componentWillUpdate() {
    this.hasMounted = false;
  }

  componentDidUpdate() {
    this.hasMounted = true;
    const session = this.refs.ace.editor.getSession();
    for (const key of Object.keys(session.getMarkers(false))) {
      session.removeMarker(key);
    }
    if (this.props.highlight) {
      const {start, end} = this.props.highlight;
      const Range = this.refs.ace.editor.getSelectionRange().constructor;
      const range = new Range(start.line - 1, start.column,
                              end.line - 1, end.column);
      // session.addMarker(range, 'ace_selected_word', 'text', true);
      session.addMarker(range, 'ace_selection', 'text');
    }
  }

  onChange(newSource) {
    if (this.props.onChange && this.hasMounted && newSource !== this.props.source) {
      this.props.onChange(newSource);
    }
  }

  onAceLoad(editor) {
    editor.getSession().setTabSize(2);
    editor.renderer.setShowGutter(this.props.showLineNumbers);
    editor.on('changeSelection', () => {
      if (this.props.onChangeSelection && this.hasMounted) {
        this.props.onChangeSelection(editor.getSelectionRange());
      }
    });
  }

  locEqual(locA, locB) {
    return locA === locB ||
           (locA && locB &&
            locA.start.line === locB.start.line &&
            locA.start.column === locB.start.column &&
            locA.end.line === locB.end.line &&
            locA.end.column === locB.end.column);
  }

  dropEdit() {
    const cursor = this.refs.ace.editor.getSelectionRange().start;
    this.forceUpdate(() => {
      this.refs.ace.editor.moveCursorTo(cursor.row, cursor.column);
    });
  }

  repaint() {
    this.refs.ace.editor.resize();
  }

  render() {
    const {name, source, mode, height, readOnly} = this.props;
    return (
      <AceEditor ref="ace"
                 mode={mode}
                 theme="eclipse"
                 name={name}
                 height={`${height}vh`}
                 width="100%"
                 fontSize={14}
                 value={source}
                 readOnly={readOnly}
                 onChange={::this.onChange}
                 onLoad={::this.onAceLoad} />
    );
  }
}
