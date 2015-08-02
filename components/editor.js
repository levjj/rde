import React, { Component, PropTypes } from 'react';
import { connect } from 'redux/react';
import { Row, Col, Panel } from 'react-bootstrap';
import AceEditor from 'react-ace/src/ace.jsx';
import deepFreeze from 'deep-freeze';
import clone from 'clone';
import $ from 'jquery';

require('brace/mode/javascript');
require('brace/theme/eclipse');

import LiveView from './liveview';
import { hotReqest } from '../actions/hotswap_actions';
import { currentState } from '../reducers/code';

@connect(state => ({
  source: state.code.source,
  isSwapping: state.code.isSwapping,
  request: state.code.request,
  error: state.code.error,
  state: currentState(state),
  render: state.code.render
}))
export default class Editor extends Component {
  static propTypes = {
    source: PropTypes.string,
    isSwapping: PropTypes.bool,
    request: PropTypes.any,
    error: PropTypes.any,
    dispatch: PropTypes.func.isRequired,
    state: PropTypes.any,
    render: PropTypes.func
  }

  onChange(newSource) {
    this.props.dispatch(hotReqest(newSource));
  }

  renderCode() {
    const { state, render } = this.props;
    if (!state || !render) return $('<div></div>');
    window.state = deepFreeze(clone(state));
    try {
      return render();
    } catch (e) {
      return $('<div class="alert alert-danger"></div>')
        .text('render() needs to be a pure function!');
    } finally {
      window.state = state;
    }
  }

  render() {
    const { source, error } = this.props;
    const footer = error && error.toString();
    return (
      <Row>
        <Col xs={12}>
          <h1>Reactive Development Environment</h1>
        </Col>
        <Col xs={6}>
          <Panel header="Source" bsStyle={this.style()} footer={footer}>
            <AceEditor mode="javascript"
                       theme="eclipse"
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
            <LiveView dom={this.renderCode()} />
          </Panel>
          <Panel header="Time Control">
            <input id="mySlider"
                type="range"
                min={1}
                max={14} />
          </Panel>
        </Col>
      </Row>
    );
  }

  style() {
    const { isSwapping, request, error } = this.props;
    if (isSwapping || request) return 'warning';
    return error ? 'danger' : 'success';
  }
}
