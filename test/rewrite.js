/* globals describe, it */
import {expect} from 'chai';

import {shouldFail, rewrite} from './helpers';

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
    window.state = {};
    const [init, render] = rewrite(src);
    expect(window.state).to.deep.equal({});
    init();
    expect(window.state).to.deep.equal({i: 1});
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
