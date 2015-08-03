import React, { Component, PropTypes } from 'react';
import { connect } from 'redux/react';
import { PageHeader, Row, Col, Panel, Button, Glyphicon, Input } from 'react-bootstrap';
import AceEditor from 'react-ace/src/ace.jsx';

require('brace/mode/javascript');
require('brace/theme/eclipse');

import { flappy, counter } from '../examples';
import LiveView from './liveview';
import { addVersion, changeReqest, swapVersion } from '../actions/version';
import { reset, swapState, toggleActive } from '../actions/state';

@connect(state => ({
  source: state.version.source,
  dom: state.state.dom,
  request: state.version.request,
  versionError: state.version.error,
  stateError: state.state.error,
  currVersion: state.version.current,
  maxVersion: state.version.versions.length - 1,
  currState: state.state.current,
  maxState: state.state.states.length - 1,
  isActive: state.state.isActive
}))
export default class Editor extends Component {
  static propTypes = {
    source: PropTypes.string,
    dom: PropTypes.any,
    request: PropTypes.any,
    versionError: PropTypes.any,
    stateError: PropTypes.any,
    dispatch: PropTypes.func.isRequired,
    currVersion: PropTypes.number.isRequired,
    maxVersion: PropTypes.number.isRequired,
    currState: PropTypes.number.isRequired,
    maxState: PropTypes.number.isRequired,
    isActive: PropTypes.bool.isRequired
  }

  componentDidMount() {
    this.hasMounted = true;
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

  onChangeVersion(e) {
    this.props.dispatch(swapVersion(+e.target.value - 1));
  }

  onChangeState(e) {
    this.props.dispatch(swapState(+e.target.value - 1));
  }

  onToggle() {
    this.props.dispatch(toggleActive());
  }

  onOpen() {
    this.props.dispatch(addVersion(counter));
  }

  onSave() {
    this.props.dispatch(addVersion(flappy));
  }

  onReset() {
    this.props.dispatch(reset());
  }

  onAceLoad(editor) {
    editor.getSession().setTabSize(2);
  }

  render() {
    const { source, dom, currVersion, maxVersion, currState, maxState, isActive } = this.props;
    return (
      <Row>
        <Col xs={12}>
          <PageHeader>Reactive Live Programming</PageHeader>
        </Col>
        <Col xs={6}>
          <Panel header="Source" bsStyle={this.versionStyle()} footer={this.versionFooter()}>
            <AceEditor mode="javascript"
                      theme="eclipse"
                      name="ace"
                      height="40em"
                      width="100%"
                      fontSize={14}
                      value={source}
                      onChange={::this.onChange}
                      onLoad={::this.onAceLoad}/>
          </Panel>
        </Col>
        <Col xs={6}>
          <Panel header="Time Control">
            <Row>
              <Col xs={2}>
                Version
              </Col>
              <Col xs={4}>
                <input type="range"
                    value={currVersion+1}
                    onChange={::this.onChangeVersion}
                    min={1}
                    max={maxVersion+1} />
              </Col>
              <Col xs={3}>
                <Input type="number"
                    bsSize="small"
                    value={currVersion+1}
                    onChange={::this.onChangeVersion}
                    min={1}
                    max={maxVersion+1} />
              </Col>
              <Col xs={3}>
                <Button onClick={::this.onOpen} bsSize="small">
                  <Glyphicon glyph="folder-open" />
                </Button>
                <Button onClick={::this.onSave} bsSize="small">
                  <Glyphicon glyph="floppy-disk" />
                </Button>
              </Col>
            </Row>
            <hr />
            <Row>
              <Col xs={2}>
                State
              </Col>
              <Col xs={4}>
                <input type="range"
                    value={currState+1}
                    onChange={::this.onChangeState}
                    min={1}
                    max={maxState+1} />
              </Col>
              <Col xs={3}>
                <Input type='number'
                    bsSize="small"
                    value={currState+1}
                    onChange={::this.onChangeState}
                    min={1}
                    max={maxState+1} />
              </Col>
              <Col xs={3}>
                <Button onClick={::this.onToggle} bsSize="small">
                  <Glyphicon glyph={isActive ? 'pause' : 'play'} />
                </Button>
                <Button onClick={::this.onReset} bsSize="small">
                  <Glyphicon glyph="repeat" />
                </Button>
              </Col>
            </Row>
          </Panel>
          <Panel header="Live View" bsStyle={this.stateStyle()} footer={this.stateFooter()}>
            <LiveView dom={dom} />
          </Panel>
        </Col>
      </Row>
    );
  }

  versionStyle() {
    const { request, versionError } = this.props;
    if (request) return 'warning';
    return versionError ? 'danger' : 'success';
  }

  versionFooter() {
    return this.props.versionError && this.props.versionError.toString();
  }

  stateStyle() {
    return this.props.stateError ? 'danger' : undefined;
  }

  stateFooter() {
    return this.props.stateError && this.props.stateError.toString();
  }
}
