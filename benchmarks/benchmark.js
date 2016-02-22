import mbench from 'mbench';
// import {expect} from 'chai';

import current, {simple, proxies, proxy} from '../src/strategy';
import {runHandlerInternal, runRenderInternal} from '../test/helpers';

function createFlatState(m) {
  const result = [];
  for (let i = 1; i < m; i++) {
    result.push({z: 1});
  }
  return {a: result, y: 1, z: 1};
}

function createDeepState(m) {
  if (m == 0) return {};
  return {
    a: createDeepState(m - 1),
    y: 1,
    z: 1
  };
}

function createTreeState(m) {
  if (m === 0) return {};
  return {
    a: createTreeState(Math.floor(m / 2)),
    b: createTreeState(m - Math.floor(m / 2) - 1),
    y: 1,
    z: 1
  };
}

const M = 100;
const N = 100;
const STEPS = 5;

function init(state) {
  let internal = current.add({}, current.current({
    state: {current: -1}
  }));
  let result = runHandlerInternal(internal, 0, () => window.state.s = state);
  return current.add({internal, current: 0}, result.state);
}

function sumUp(current) {
  let res = 0;
  if (current.length) {
    for (let i = 0; i < current.length; i++) {
      res += sumUp(current[i]);
    }
  }
  if (current.a) {
    res += sumUp(current.a);
  }
  if (current.b) {
    res += sumUp(current.b);
  }
  if (current.z) {
    res += current.z;
  }
  return res;
}

function render(internal, n) {
  return runRenderInternal(internal, n, () => {
    return sumUp(window.state.s);
  });
}

function handle(internal, n) {
  let result = runHandlerInternal(internal, n, () => {
    window.state.s.z += window.state.s.y;
  });
  return current.add({internal, current: n}, result.state);
}

function bench(kind, type, stateBuilder) {
  for (let n = 1; n < N; n += N / STEPS) {
    for (let m = 1; m < M; m += M / STEPS) {
      let internal;
      const t = mbench(() => {
        const {dom} = render(internal, n);
        // expect(dom).to.be.equal(n + m - 1);
        return dom;
      }, {setup: () => {
        global.window = {};
        internal = init(stateBuilder(m));
        for (let i = 1; i < n; i++) {
          internal = handle(internal, i);
        }
      }});
      console.log(`${kind},render,${type},${m},${n},${t[0]},${t[1]}`);
    }
  }
  for (let n = 1; n < N; n += N / STEPS) {
    for (let m = 1; m < M; m += M / STEPS) {
      let internal;
      const t = mbench(() => {
        internal = handle(internal, n);
        // const state = current.current({
        //   state: {internal, current: n + 1}
        // });
        // expect(state.s.z).to.be.eql(n + 1);
      }, {setup: () => {
        global.window = {};
        internal = init(stateBuilder(m));
        for (let i = 1; i < n; i++) {
          internal = handle(internal, i);
        }
      }});
      console.log(`${kind},handle,${type},${m},${n},${t[0]},${t[1]}`);
    }
  }
}


it('bench', () => {
  console.log('Strategy,Benchmark,StateShape,StateSize,Events,Time,Memory');
  const strategies = {simple, proxies, proxy};

  for (let key in strategies) {
    const strategy = strategies[key];
    current.handle = strategy.handle;
    current.render = strategy.render;
    current.current = strategy.current;
    current.add = strategy.add;

    bench(key, 'flat', createFlatState);
    bench(key, 'deep', createDeepState);
    bench(key, 'tree', createTreeState);
  }
});
