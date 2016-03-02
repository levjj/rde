/* globals describe, it */
/* eslint no-unused-expressions:0 */
import {expect} from 'chai';
import {parse} from 'esprima-fb';
import {generate} from 'escodegen';

import {shouldFail, rewrite} from './helpers';
import {rewriteSymStrings, rewriteOps} from '../src/rewriting';
import {SymString, operators} from '../src/symstr';

describe('rewrite JSX', () => {
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
    const dom = render();
    expect(dom.name.toSourceString()).to.equal('a');
    expect(dom.attributes).to.deep.equal({});
    expect(dom.children).to.deep.equal([]);
    expect(`<${dom.name}></${dom.name}>`).to.be.equal('<a></a>');
  });

  it('should supports attributes', () => {
    const [, render] = rewrite('function render() { return <a x="f" />; }');
    const dom = render();
    expect(dom.name.toSourceString()).to.equal('a');
    expect(dom.attributes.x.toSourceString()).to.equal('f');
    expect(dom.children).to.deep.equal([]);
  });

  it('should supports JavaScript as attributes', () => {
    const [, render] = rewrite('function render() { return <a x={"f"} />; }');
    const dom = render();
    expect(dom.name.toSourceString()).to.equal('a');
    expect(dom.attributes.x.toSourceString()).to.equal('f');
    expect(dom.children).to.deep.equal([]);
  });

  it('should support child elements', () => {
    const [, render] = rewrite('function render() { return <a><b /></a>; }');
    const dom = render();
    expect(dom.name.toSourceString()).to.equal('a');
    expect(dom.attributes).to.deep.equal({});
    expect(dom.children).to.have.length(1);
    expect(dom.children[0].name.toSourceString()).to.equal('b');
    expect(dom.children[0].attributes).to.deep.equal({});
    expect(dom.children[0].children).to.deep.equal([]);
  });

  it('should support JavaScript as child element', () => {
    const [, render] = rewrite('function render() { return <a>{"foo"}</a>; }');
    const dom = render();
    expect(dom.name.toSourceString()).to.equal('a');
    expect(dom.attributes).to.deep.equal({});
    expect(dom.children).to.have.length(1);
    expect(dom.children[0].toSourceString()).to.equal('foo');
  });
});

function rew(src) {
  const parsed = parse(src, {range: true});
  const {ast, mapping} = rewriteSymStrings(parsed);
  const rewritten = rewriteOps(ast);
  const generated = generate(rewritten);
  /* eslint no-eval:0 */
  global.operators = operators;
  global.sym = SymString.single;
  const res = eval(generated);
  return {ast, res, mapping};
}

describe('rewrite symbolic strings', () => {

  it('rewrite string literals', () => {
    const {res, mapping} = rew('"abc"');
    expect(mapping).to.be.an('object');
    expect(Object.keys(mapping)).to.have.length(1);
    const id = +Object.keys(mapping)[0];
    expect(res.strs).to.not.be.undefined;
    expect(res.strs).to.deep.equal([{
      str: 'abc',
      id,
      idx: 0,
      start: 0
    }]);
    expect(mapping[id]).to.deep.equal([0, 5]);
  });

  it('rewrite string concat literal', () => {
    const {res, mapping} = rew('"abc" + 42');
    expect(mapping).to.be.an('object');
    expect(Object.keys(mapping)).to.have.length(1);
    const id = +Object.keys(mapping)[0];
    expect(res.strs).to.not.be.undefined;
    expect(res.strs).to.deep.equal([{
      str: 'abc',
      id,
      idx: 0,
      start: 0
    }, {
      str: '42',
      id: 0,
      idx: 0,
      start: 3
    }]);
    expect(mapping[id]).to.deep.equal([0, 5]);
  });

  it('rewrite string concat two literals', () => {
    const {res, mapping} = rew('"abc" + "def"');
    expect(mapping).to.be.an('object');
    expect(Object.keys(mapping)).to.have.length(2);
    const id = +Object.keys(mapping)[0];
    const id2 = +Object.keys(mapping)[1];
    expect(res.strs).to.not.be.undefined;
    expect(res.strs).to.deep.equal([{
      str: 'abc',
      id,
      idx: 0,
      start: 0
    }, {
      str: 'def',
      id: id2,
      idx: 0,
      start: 3
    }]);
    expect(mapping[id]).to.deep.equal([0, 5]);
    expect(mapping[id2]).to.deep.equal([8, 13]);
  });
});

export default function() {}
