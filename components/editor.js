import React, { Component, PropTypes } from 'react';
import { connect } from 'redux/react';
import { Row, Col, Panel } from 'react-bootstrap';
import AceEditor from 'react-ace/src/ace.jsx';

require('brace/mode/javascript');
require('brace/theme/github');

import { hotReqest } from '../actions/hotswap_actions';

@connect(state => ({
  source: state.code.source,
  isSwapping: state.code.isSwapping,
  request: state.code.request,
  error: state.code.error,
  a: state.code.a
}))
export default class Editor extends Component {

  onChange(newSource) {
    this.props.dispatch(hotReqest(newSource));
  }

  render() {
    const { source, isSwapping, request, error, a } = this.props;
    const style = (isSwapping || request)
                  ? 'warning'
                  : (error ? 'danger' : 'success');
    return (
      <Row>
        <Col xs={12}>
          <h1>Reactive Development Environment</h1>
        </Col>
        <Col xs={6}>
          <Panel header="Source" bsStyle={style}>
            <AceEditor mode="javascript"
                       theme="github"
                       name="ace"
                       height="30em"
                       width="100%"
                       fontSize={14}
                       value={source}
                       onChange={::this.onChange} />
          </Panel>
        </Col>
        <Col xs={6}>
          <Panel header="Result">
            How many As: {a}
          </Panel>
        </Col>
      </Row>
    );
  }
}
