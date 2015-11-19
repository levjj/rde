import React, { Component, PropTypes } from 'react';
import { connect } from 'redux/react';
import { PageHeader, Row, Col, Panel, Button, Glyphicon, Input } from 'react-bootstrap';
import $ from 'jquery';
import filePicker from 'component-file-picker';

import { flappy, counter } from '../examples';
import LiveView from './liveview';
import Editor from './editor';
import { addVersion, swapVersion } from '../actions/version';
import { reset, swapState, toggleActive } from '../actions/state';
import strategy from '../strategy';

@connect(state => ({
  dom: state.state.dom,
  request: state.version.request,
  versionError: state.version.error,
  stateError: state.state.error,
  currVersion: state.version.current,
  maxVersion: state.version.versions.length - 1,
  currState: state.state.current,
  maxState: strategy.maxState(state),
  isActive: state.state.isActive,
  source: state.version.source
}))
export default class App extends Component {
  static propTypes = {
    dom: PropTypes.any,
    request: PropTypes.any,
    versionError: PropTypes.any,
    stateError: PropTypes.any,
    currVersion: PropTypes.number.isRequired,
    maxVersion: PropTypes.number.isRequired,
    currState: PropTypes.number.isRequired,
    maxState: PropTypes.number.isRequired,
    isActive: PropTypes.bool.isRequired,
    isDemo: PropTypes.bool,
    showTimeControl: PropTypes.bool.isRequired,
    source: PropTypes.string,
    dispatch: PropTypes.func.isRequired
  }

  componentWillMount() {
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
    /* eslint no-alert:0 */
    filePicker({accept: ['.js']}, ([file]) => {
      if (file === undefined) return alert('No file selected');
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result === undefined) return alert('No file contents');
        this.props.dispatch(addVersion(reader.result));
      };
      reader.readAsText(file);
    });
  }

  onSave() {
    const src = encodeURIComponent(this.props.source);
    const a = $('<a>')
    .attr({
      href: 'data:text/plain;charset=utf-8,' + src,
      download: 'code.js'
    })
    .appendTo($('body'));
    a[0].click();
    a.remove();
  }

  onReset() {
    this.props.dispatch(reset());
  }

  loadFlappy(evt) {
    evt.preventDefault();
    this.props.dispatch(addVersion(flappy));
    this.props.dispatch(reset());
  }

  loadCounter(evt) {
    evt.preventDefault();
    this.props.dispatch(addVersion(counter));
    this.props.dispatch(reset());
  }

  sourceHeader() {
    return (<span>
          Source
          {!this.props.isDemo && (
            <span className="pull-right">
              <Button bsSize="small"
                onClick={::this.loadCounter}>
                Counter Example
              </Button>
              {' '}
              <Button bsSize="small"
                onClick={::this.loadFlappy}>
                Flappy Bird Example
              </Button>
            </span>)}
        </span>);
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

  render() {
    const { dom, dispatch, currVersion, maxVersion, currState, maxState, isActive, isDemo, showTimeControl } = this.props;
    return (
      <Row>
        {!isDemo && (
          <Col xs={12}>
            <PageHeader>Reactive Live Programming</PageHeader>
          </Col>)}
        <Col xs={6}>
          <Panel header={this.sourceHeader()} bsStyle={this.versionStyle()} footer={this.versionFooter()}>
            <Editor showLineNumbers={!isDemo} />
          </Panel>
        </Col>
        <Col xs={6}>
          {showTimeControl && (
          <Panel header="Time Control">
            <Row>
              <Col xs={2}>
                Version
              </Col>
              <Col xs={4}>
                <input type="range"
                    value={currVersion + 1}
                    onChange={::this.onChangeVersion}
                    min={1}
                    max={maxVersion + 1} />
              </Col>
              <Col xs={3}>
                <Input type="number"
                    bsSize="small"
                    value={currVersion + 1}
                    onChange={::this.onChangeVersion}
                    min={1}
                    max={maxVersion + 1} />
              </Col>
              <Col xs={3}>
                {!isDemo &&
                  <Button onClick={::this.onOpen} bsSize="small">
                    <Glyphicon glyph="folder-open" />
                  </Button>}
                {!isDemo &&
                  <Button onClick={::this.onSave} bsSize="small">
                    <Glyphicon glyph="floppy-disk" />
                  </Button>}
                {isDemo &&
                  <Button onClick={::this.onReset} bsSize="small">
                    <Glyphicon glyph="repeat" />
                  </Button>}
              </Col>
            </Row>
            <hr />
            <Row>
              <Col xs={2}>
                State
              </Col>
              <Col xs={4}>
                <input type="range"
                    value={currState + 1}
                    onChange={::this.onChangeState}
                    min={1}
                    max={maxState + 1} />
              </Col>
              <Col xs={3}>
                <Input type="number"
                    bsSize="small"
                    value={currState + 1}
                    onChange={::this.onChangeState}
                    min={1}
                    max={maxState + 1} />
              </Col>
              <Col xs={3}>
                <Button onClick={::this.onToggle} bsSize="small">
                  <Glyphicon glyph={isActive ? 'pause' : 'play'} />
                </Button>
                {!isDemo &&
                  <Button onClick={::this.onReset} bsSize="small">
                    <Glyphicon glyph="repeat" />
                  </Button>}
              </Col>
            </Row>
          </Panel>)}
          <Panel header="Live View" bsStyle={this.stateStyle()} footer={this.stateFooter()}>
            <LiveView dom={dom} dispatch={dispatch} />
          </Panel>
        </Col>
      </Row>
    );
  }
}
