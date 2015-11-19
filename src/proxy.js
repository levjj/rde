const Proxy = (typeof window === 'undefined' || typeof window.Proxy !== 'undefined') && require('harmony-proxy');

const stateMembranes = new WeakMap();

class StateMembrane {
  constructor(state) {
    this.proxies = new WeakSet();
    this.objects = new WeakMap();
    this.changes = new WeakMap();
    this.state = this.wrap(state);
    this.frozen = false;
    this.version = -1;
    this.maxVersion = -1;
  }

  lookup(versions) {
    const lastIdx = versions.length - 1;
    if (versions[lastIdx] <= this.version) return lastIdx;
    let leftIdx = 0;
    let rightIdx = lastIdx;
    while (leftIdx + 1 < rightIdx) {
      const midIdx = 0 | (leftIdx + (leftIdx + rightIdx) / 2);
      if (versions[midIdx] > this.version) {
        rightIdx = midIdx;
      } else {
        leftIdx = midIdx;
      }
    }
    if (leftIdx < rightIdx && versions[rightIdx] <= this.version) {
      leftIdx = rightIdx;
    }
    return versions[leftIdx] > this.version ? -1 : leftIdx;
  }

  wrap(x) {
    if (x === null ||
        (typeof x !== 'object' && typeof x !== 'function') ||
        this.proxies.has(x)) {
      return x;
    }
    if (this.objects.has(x)) {
      return this.objects.get(x);
    }
    const proxy = new Proxy(x, {
      get: (target, key) => {
        const changes = this.changes.get(target);
        if (changes && Object.hasOwnProperty.call(changes, key)) {
          const idx = this.lookup(changes[key][0]);
          if (idx >= 0) {
            return this.wrap(changes[key][1][idx]);
          }
        }
        return this.wrap(target[key]);
      },
      set: (target, key, value) => {
        if (this.frozen) {
          throw new TypeError('Mutation to immutable object');
        }
        let objChanges = this.changes.get(target);
        if (!objChanges) {
          objChanges = {};
          this.changes.set(target, objChanges);
        }
        if (!Object.hasOwnProperty.call(objChanges, key)) {
          objChanges[key] = [[], []];
        }
        const [versions, data] = objChanges[key];
        const idx = this.lookup(versions);
        if (versions.length >= 0 && idx < versions.length - 1) {
          versions.splice(idx + 1);
          data.splice(idx + 1);
        }
        if (idx >= 0 && versions[idx] === this.version) {
          data[idx] = value;
        } else {
          versions.push(this.version);
          data.push(value);
        }
      },
      apply: () => {
        try {
          throw new TypeError('Call of a first-order value');
        } catch (e) {
          throw e;
        }
      }
    });
    this.proxies.add(proxy);
    this.objects.set(x, proxy);
    return proxy;
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
  }

  cow() {
    this.version++;
  }

  timeTravel(version) {
    this.version = version;
  }

  getState() {
    return this.state;
  }

  getMaxVersion() {
    return this.maxVersion;
  }

  setMaxVersion(maxVersion) {
    this.maxVersion = maxVersion;
  }
}

export default function stateMembrane(state) {
  if (stateMembranes.has(state)) {
    return stateMembranes.get(state);
  }
  const membrane = new StateMembrane(state);
  stateMembranes.set(membrane.getState(), membrane);
  return membrane;
}

/**
 * The cow proxy is a little bit like an object capability system.
 * If you have a reference to a certain object (identify) then it
 * obviously existed, so you simply reach it and then do your property
 * lookup locally through all accumulated proxies to find the most
 * recent value of a property.
 *
 * Without proxies, object identities are eternal, and the desired version
 * is used as index into the list of property changes.  Problem: you still
 * have to pay O(n) for looking up unchanged properties in a changing object.
 *
 * Ideally, we would keep a version history per property field.  This would
 * work fine but what about properties that were never changed, so don't
 * have a version history?  Proposed solution: use initial value!
 */
