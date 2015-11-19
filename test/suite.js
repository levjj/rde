/* globals describe, before */

import current, {simple, proxies, proxy} from '../src/strategy';

import immutability from './immutability';
import firstOrder from './first-order';
import timeTravel from './time-travel';

describe('simple strategy', () => {

  before(() => {
    current.handle = simple.handle;
    current.render = simple.render;
    current.current = simple.current;
    current.add = simple.add;
  });

  immutability();
  firstOrder();
  timeTravel();
});

describe('proxy wrapping', () => {

  before(() => {
    current.handle = proxies.handle;
    current.render = proxies.render;
    current.current = proxies.current;
    current.add = proxies.add;
  });

  immutability();
  firstOrder();
  timeTravel();
});

describe('single membrane', () => {

  before(() => {
    current.handle = proxy.handle;
    current.render = proxy.render;
    current.current = proxy.current;
    current.add = proxy.add;
  });

  immutability();
  firstOrder();
  timeTravel();
});

export default function() {}
