const Proxy = (typeof window === 'undefined' || typeof window.Proxy !== 'undefined') && require('harmony-proxy');

const immutableProxies = new WeakSet();
const immutableObjects = new WeakMap();

export function immutable(x) {
  if (x === null ||
      (typeof x !== 'object' && typeof x !== 'function') ||
      immutableProxies.has(x)) {
    return x;
  }
  if (immutableObjects.has(x)) {
    return immutableObjects.get(x);
  }
  const proxy = new Proxy(x, {
    get: (target, key) => immutable(target[key]),
    set: () => {
      throw new TypeError('Mutation to immutable object');
    }
  });
  immutableProxies.add(proxy);
  immutableObjects.set(x, proxy);
  return proxy;
}

const lazyFirstOrderProxies = new WeakSet();
const lazyFirstOrderObjects = new WeakMap();

export function lazyFirstOrder(x) {
  if (x === null ||
      (typeof x !== 'object' && typeof x !== 'function') ||
      lazyFirstOrderProxies.has(x)) {
    return x;
  }
  if (lazyFirstOrderObjects.has(x)) {
    return lazyFirstOrderObjects.get(x);
  }
  const proxy = new Proxy(x, {
    get: (target, key) => lazyFirstOrder(target[key]),
    set: (target, key, value) => {
      target[key] = value;
      return true;
    },
    apply: () => {
      throw new TypeError('Call of a first-order value');
    }
  });
  lazyFirstOrderProxies.add(proxy);
  lazyFirstOrderObjects.set(x, proxy);
  return proxy;
}

export function cow(r) {
  const cowProxies = new WeakSet();
  const cowObjects = new WeakMap();
  const changes = new WeakMap();

  const wrap = (x) => {
    if (x === null ||
        (typeof x !== 'object' && typeof x !== 'function') ||
        cowProxies.has(x)) {
      return x;
    }
    if (cowObjects.has(x)) {
      return cowObjects.get(x);
    }
    const proxy = new Proxy(x, {
      get: (target, key) => {
        const props = changes.get(target);
        if (props && Object.hasOwnProperty.call(props, key)) {
          return wrap(props[key]);
        }
        return wrap(target[key]);
      },
      has: (target, key) => {
        const props = changes.get(target);
        return (props && Object.hasOwnProperty.call(props, key)) || Object.hasOwnProperty.call(target, key);
      },
      set: (target, key, value) => {
        const props = changes.get(target);
        if (props) {
          props[key] = value;
        } else {
          changes.set(target, {[key]: value});
        }
        return true;
      },
      enumerate: (target) => function* enumerate() {
        const props = changes.get(target);
        const prev = [];
        if (props) {
          for (const k in props) {
            yield k;
            prev.push(k);
          }
        }
        for (const k in target) {
          if (!prev.includes(k)) {
            yield k;
          }
        }
      },
      ownKeys: (target) => {
        const props = changes.get(target);
        const result = props ? Object.keys(props) : [];
        const targetKeys = Object.keys(target);
        for (const k in targetKeys) {
          if (!result.includes(k)) {
            result.push(k);
          }
        }
        return result;
      }
    });
    cowProxies.add(proxy);
    cowObjects.set(x, proxy);
    return proxy;
  };
  return wrap(r);
}
