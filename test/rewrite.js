/* globals describe, it */
import {expect} from 'chai';

import {ADD_VERSION, ADD_VERSION_FAILED} from '../src/actions/types';
import {addVersion} from '../src/actions/version';

function shouldFail(src) {
  const action = addVersion(src)();
  expect(action.type).to.be.equal(ADD_VERSION_FAILED);
}

function rewrite(src, global = {}) {
  const action = addVersion(src, global)();
  if (action.error) console.error(action.error, action.error.stack);
  expect(action.type).to.be.equal(ADD_VERSION);
  return [action.init, action.render];
}

describe('rewriting', () => {
  it('rejects invalid programs', () => {
    shouldFail('var i = 23;');
    shouldFail('function rende() { return 23; }');
    shouldFail('function render() { return x; }');
    shouldFail('function render() { return 1 +++ 2; }');
  });

  it('should support a trivial render function', () => {
    const [, render] = rewrite('function render() { return 1; }');
    expect(render()).to.be.equal(1);
  });

  it('should rewrite state accesses', () => {
    const src = 'var i = 1; function render() { return i; }';
    const state = {};
    const [init, render] = rewrite(src, {state});
    expect(state).to.deep.equal({});
    init();
    expect(state).to.deep.equal({i: 1});
    expect(render()).to.be.equal(1);
  });

  it('should compile simple JSX', () => {
    const [, render] = rewrite('function render() { return <a />; }');
    expect(render()).to.deep.equal({
      name: 'a',
      attributes: {},
      children: []
    });
  });

  it('should supports attributes', () => {
    const [, render] = rewrite('function render() { return <a x="f" />; }');
    expect(render()).to.deep.equal({
      name: 'a',
      attributes: {x: 'f'},
      children: []
    });
  });

  it('should supports JavaScript as attributes', () => {
    const [, render] = rewrite('function render() { return <a x={"f"} />; }');
    expect(render()).to.deep.equal({
      name: 'a',
      attributes: {x: 'f'},
      children: []
    });
  });

  it('should support child elements', () => {
    const [, render] = rewrite('function render() { return <a><b /></a>; }');
    expect(render()).to.deep.equal({
      name: 'a',
      attributes: {},
      children: [{name: 'b', attributes: {}, children: []}]
    });
  });

  it('should support JavaScript as child element', () => {
    const [, render] = rewrite('function render() { return <a>{"foo"}</a>; }');
    expect(render()).to.deep.equal({
      name: 'a',
      attributes: {},
      children: ['foo']
    });
  });
});

export default function() {}