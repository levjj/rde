const immutableProxies = new WeakSet();
const immutableObjects = new WeakMap();

export function immutable(x) {
  if (x === null ||
      typeof x !== 'object' ||
      typeof x !== 'function' ||
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
      typeof x !== 'object' ||
      typeof x !== 'function' ||
      lazyFirstOrderProxies.has(x)) {
    return x;
  }
  if (lazyFirstOrderObjects.has(x)) {
    return lazyFirstOrderObjects.get(x);
  }
  const proxy = new Proxy(x, {
    get: (target, key) => lazyFirstOrder(target[key]),
    set: () => {
      throw new TypeError('Mutation to immutable object');
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
        typeof x !== 'object' ||
        typeof x !== 'function' ||
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
      set: (target, key, value) => {
        const props = changes.get(target);
        if (props) {
          props[key] = value;
        } else {
          changes.set(target, {[key]: value});
        }
        return true;
      }
    });
    cowProxies.add(proxy);
    cowObjects.set(x, proxy);
    return proxy;
  };
  return wrap(r);
}
